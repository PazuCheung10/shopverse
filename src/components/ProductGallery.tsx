import Image from 'next/image';

interface ProductGalleryProps {
  imageUrl: string;
  name: string;
}

export default function ProductGallery({ imageUrl, name }: ProductGalleryProps) {
  return (
    <div className="relative aspect-square w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-white/5">
      <Image
        src={imageUrl}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />
    </div>
  );
}
