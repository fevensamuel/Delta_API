import { Eye, MapPin, Play, Video, X, Camera } from 'lucide-react';
import React, { useState } from 'react';
import { translations } from '../translations.js';
import type { GalleryItem, Language } from '../types.js';

interface GallerySectionProps {
  gallery: GalleryItem[];
  currentLang: Language;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery, currentLang }) => {
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'photo' | 'video'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const t = translations[currentLang];

  const categories = ['ALL', 'Makkah', 'Madinah', 'Groups', 'Hotels'];

  const filtered = gallery.filter(g => {
    const matchesType = mediaFilter === 'ALL' ? true : g.type === mediaFilter;
    const matchesCategory = selectedCategory === 'ALL' ? true : g.category === selectedCategory;
    return matchesType && matchesCategory;
  });

  const getTitle = (item: GalleryItem) => {
    const it = item as any;
    if (currentLang === 'ar') return item.titleAr || it.title_ar || item.titleEn || it.title_en || it.title || '';
    if (currentLang === 'am') return it.titleAm || it.title_am || item.titleEn || it.title_en || it.title || '';
    return item.titleEn || it.title || it.title_en || '';
  };

  const getImgUrl = (item: GalleryItem) => item.imageUrl || (item as any).image_url || '';
  const getVideoUrl = (item: GalleryItem) => item.videoUrl || (item as any).video_url || '';

  return (
    <section id="gallery" className="py-16 bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Pilgrim Moments & Holy Sites
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
            {t.gallery_heading}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.gallery_subheading}
          </p>
        </div>

        {/* Media Type & Category Filters */}
        <div className="flex flex-col items-center gap-3 mb-10">
          {/* Photo vs Video Switcher */}
          <div className="inline-flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 space-x-1">
            <button
              onClick={() => setMediaFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mediaFilter === 'ALL' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              All Media ({gallery.length})
            </button>
            <button
              onClick={() => setMediaFilter('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                mediaFilter === 'photo' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({gallery.filter(g => g.type === 'photo').length})</span>
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                mediaFilter === 'video' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos ({gallery.filter(g => g.type === 'video').length})</span>
            </button>
          </div>

          {/* Location / Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'All Holy Sites' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const isVideo = item.type === 'video';
            const imgUrl = getImgUrl(item);

            return (
              <div
                key={item.id}
                onClick={() => setLightboxItem(item)}
                className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer group shadow-xl relative"
              >
                <div className="h-60 overflow-hidden relative">
                  <img
                    src={imgUrl}
                    alt={getTitle(item)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85"></div>
                  
                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                      isVideo 
                        ? 'bg-rose-500 text-white shadow-md' 
                        : 'bg-slate-950/80 text-amber-400 border border-slate-700'
                    }`}>
                      {isVideo ? (
                        <>
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </>
                      ) : (
                        <span>{item.category || 'Photo'}</span>
                      )}
                    </span>
                    {item.duration && (
                      <span className="bg-slate-950/90 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Play Button Icon for Video */}
                  {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 p-1.5 bg-slate-950/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4 text-amber-400" />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{getTitle(item)}</h4>
                    {item.location && (
                      <p className="text-[11px] text-slate-300 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{item.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6">
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950 text-slate-300 hover:text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {lightboxItem.type === 'video' && getVideoUrl(lightboxItem) ? (
              <div className="w-full rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  controls
                  autoPlay
                  src={getVideoUrl(lightboxItem)}
                  poster={getImgUrl(lightboxItem)}
                  className="w-full max-h-[60vh] object-contain rounded-xl"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              </div>
            ) : (
              <img
                src={getImgUrl(lightboxItem)}
                alt={getTitle(lightboxItem)}
                className="w-full max-h-[65vh] object-cover rounded-xl"
              />
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  lightboxItem.type === 'video' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'text-amber-400'
                }`}>
                  {lightboxItem.type === 'video' ? 'Holy Video Recording' : `${lightboxItem.category || 'Holy'} Photo`}
                </span>
                {lightboxItem.duration && (
                  <span className="text-xs text-slate-400 font-mono">({lightboxItem.duration})</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white font-serif mt-1">{getTitle(lightboxItem)}</h3>
              {lightboxItem.location && (
                <p className="text-xs text-emerald-400 flex items-center space-x-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{lightboxItem.location}</span>
                </p>
              )}
              {lightboxItem.description && (
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">{lightboxItem.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
