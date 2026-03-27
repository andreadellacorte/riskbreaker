import { galleryImages } from "./gallery-images.js";

export default function GalleryPage() {
  return (
    <main className="gallery-page">
      <section aria-label="Uploaded gallery" className="gallery-grid">
        {galleryImages.map((image) => (
          <figure className="gallery-card" key={image.src}>
            <div className="gallery-image-wrap">
              <img alt={image.alt} loading="eager" src={image.src} />
            </div>
            <figcaption className="gallery-caption">{image.description}</figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
