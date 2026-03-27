export type GalleryImage = {
  src: string;
  alt: string;
  description: string;
};

export const galleryImages: GalleryImage[] = [
  {
    src: "/gallery/playstation-boot.png",
    alt: "PlayStation boot screen with Riskbreaker overlay controls",
    description: "PlayStation boot",
  },
  {
    src: "/gallery/riskbreaker-overlay.png",
    alt: "Riskbreaker runtime overlay over Vagrant Story intro",
    description: "Square boot splash",
  },
  {
    src: "/gallery/vagrant-story-menu.png",
    alt: "Vagrant Story modernized character status and story panel",
    description: "Status menu remaster",
  },
  {
    src: "/gallery/equipment-screen.png",
    alt: "Vagrant Story modernized equipment screen comparison panel",
    description: "Equipment screen remaster",
  },
];
