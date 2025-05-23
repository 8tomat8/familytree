'use client';

import { Gallery } from '../components/Gallery';
import { ImageSizeContext } from '../context/ImageSizeContext';

export default function Home() {

  return (
    <ImageSizeContext.Provider value={3000}>
      <main className="h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Gallery />
        </div>
      </main>
    </ImageSizeContext.Provider>
  );
}
