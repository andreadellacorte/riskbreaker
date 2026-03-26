#!/usr/bin/env python3
"""
Extract game files from Vagrant Story (USA) BIN/CUE image.

Extracts:
  - All files from the MAP directory (ZND, ZUD, MPD, etc.)
  - BATTLE.PRG (needed for SHP/WEP LBA tables)
  - SMAP.MPD, TITLE.STR if present

Usage:
    python3 extract.py [--out OUT_DIR]
"""

import struct
import os
import argparse
import shutil

BIN = os.path.join(
    os.path.dirname(__file__),
    "roms/Vagrant Story (USA)/Vagrant Story (USA).bin"
)

SECTOR_SIZE = 2352
DATA_OFFSET = 24    # MODE2 Form1: 12 sync + 4 header + 8 subheader
DATA_SIZE   = 2048

# ──────────────────────────────────────────────
# Low-level sector / ISO9660 helpers
# ──────────────────────────────────────────────

def read_sector(f, lba: int) -> bytes:
    f.seek(lba * SECTOR_SIZE)
    raw = f.read(SECTOR_SIZE)
    if len(raw) < SECTOR_SIZE:
        return b"\x00" * DATA_SIZE
    return raw[DATA_OFFSET: DATA_OFFSET + DATA_SIZE]

def read_file(f, lba: int, size: int) -> bytes:
    sectors_needed = (size + DATA_SIZE - 1) // DATA_SIZE
    data = b""
    for i in range(sectors_needed):
        data += read_sector(f, lba + i)
    return data[:size]

def iter_directory(f, dir_lba: int, dir_size: int):
    """Yield (name, lba, size, is_dir) for each entry in an ISO9660 directory."""
    raw = read_file(f, dir_lba, dir_size)
    pos = 0
    while pos < len(raw):
        rec_len = raw[pos]
        if rec_len == 0:
            # skip to next sector boundary
            pos = ((pos // DATA_SIZE) + 1) * DATA_SIZE
            continue
        if pos + rec_len > len(raw):
            break
        rec = raw[pos: pos + rec_len]
        file_lba  = struct.unpack_from("<I", rec, 2)[0]
        file_size = struct.unpack_from("<I", rec, 10)[0]
        flags     = rec[25]
        name_len  = rec[32]
        name_raw  = rec[33: 33 + name_len]
        # strip version suffix ";1"
        name = name_raw.decode("ascii", errors="replace").split(";")[0]
        is_dir = bool(flags & 0x02)
        if name not in ("", "\x00", "\x01"):
            yield name, file_lba, file_size, is_dir
        pos += rec_len

def find_entry(f, dir_lba: int, dir_size: int, target: str):
    """Return (lba, size) for a named entry, case-insensitive."""
    for name, lba, size, _ in iter_directory(f, dir_lba, dir_size):
        if name.upper() == target.upper():
            return lba, size
    return None, None

# ──────────────────────────────────────────────
# Main extraction
# ──────────────────────────────────────────────

def extract(out_dir: str):
    os.makedirs(out_dir, exist_ok=True)

    with open(BIN, "rb") as f:
        # Parse volume descriptor (sector 16)
        vd = read_sector(f, 16)
        assert vd[1:6] == b"CD001", "Not an ISO9660 disc"
        root_lba  = struct.unpack_from("<I", vd, 158)[0]
        root_size = struct.unpack_from("<I", vd, 166)[0]
        print(f"Root directory: LBA={root_lba}, size={root_size}")

        # ── Extract sub-directories by name ───────────────────────────────
        def extract_dir(dir_lba, dir_size, out_path, label):
            os.makedirs(out_path, exist_ok=True)
            count = 0
            for name, lba, size, is_dir in iter_directory(f, dir_lba, dir_size):
                if is_dir:
                    continue
                dest = os.path.join(out_path, name)
                print(f"  {name:35s}  {size:8d} bytes  LBA {lba}")
                with open(dest, "wb") as out:
                    out.write(read_file(f, lba, size))
                count += 1
            print(f"  → {count} files extracted to {out_path}")
            return count

        # Root entries
        root_entries = list(iter_directory(f, root_lba, root_size))

        for name, lba, size, is_dir in root_entries:
            # Extract BATTLE/ directory (contains BATTLE.PRG)
            if is_dir and name.upper() == "BATTLE":
                print(f"\nBATTLE/ directory: LBA={lba}")
                extract_dir(lba, size, os.path.join(out_dir, "BATTLE"), "BATTLE")

            # Extract OBJ/ directory (SHP + SEQ character files)
            if is_dir and name.upper() == "OBJ":
                print(f"\nOBJ/ directory: LBA={lba}, size={size}")
                extract_dir(lba, size, os.path.join(out_dir, "OBJ"), "OBJ")
                # Copy WEP files to apps/web/public/wep/ for the 3D weapon viewer
                wep_src = os.path.join(out_dir, "OBJ")
                wep_dst = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "wep")
                os.makedirs(wep_dst, exist_ok=True)
                copied = 0
                for fname in os.listdir(wep_src):
                    if fname.upper().endswith(".WEP"):
                        shutil.copy2(os.path.join(wep_src, fname), os.path.join(wep_dst, fname))
                        copied += 1
                print(f"  → {copied} .WEP files copied to {wep_dst}")

        # ── Find MAP directory ─────────────────────────────────────────────
        map_lba, map_size = find_entry(f, root_lba, root_size, "MAP")
        if map_lba is None:
            print("WARNING: MAP directory not found")
            return

        map_out = os.path.join(out_dir, "MAP")
        os.makedirs(map_out, exist_ok=True)
        print(f"\nMAP directory: LBA={map_lba}, size={map_size}")

        count = 0
        for name, lba, size, is_dir in iter_directory(f, map_lba, map_size):
            if is_dir:
                continue
            dest = os.path.join(map_out, name)
            print(f"  {name:20s}  {size:8d} bytes  LBA {lba}")
            with open(dest, "wb") as out:
                out.write(read_file(f, lba, size))
            count += 1

        print(f"\nDone — extracted {count} MAP files to {map_out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Vagrant Story game files")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "extracted"),
                        help="Output directory (default: ./extracted)")
    args = parser.parse_args()
    extract(args.out)
