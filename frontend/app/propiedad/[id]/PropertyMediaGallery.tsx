"use client";

import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import type { PropertyMediaItem } from "@/lib/properties";
import { videoPreview } from "@/lib/propertyPresentation";
import styles from "./PropertyDetailPage.module.css";

type PropertyMediaGalleryProps = {
  title: string;
  location: string;
  photos: string[];
  media?: PropertyMediaItem[];
  videoUrl?: string | null;
  fallbackImage: string;
  facts?: ReactNode;
};

function getEmbeddedVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) return url;
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (host === "player.vimeo.com" || parsed.pathname.includes("/embed/")) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

function isSupportedPublicVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (/^\/api\/panel-web\/media\/web-[a-f0-9-]{36}\/\d+\/video\.mp4$/.test(url)) return true;
  if (getEmbeddedVideoUrl(url)) return true;

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith(".mp4") || pathname.endsWith(".m3u8");
  } catch {
    return false;
  }
}

export function PropertyMediaGallery({title,location,photos,media,videoUrl,fallbackImage,facts}:PropertyMediaGalleryProps):JSX.Element{
 const safeVideoUrl=isSupportedPublicVideoUrl(videoUrl)?videoUrl:null;
 const embeddedVideoUrl=getEmbeddedVideoUrl(safeVideoUrl);
 const photoMedia=useMemo(()=>{const items=media?.filter(i=>i.type==='photo'&&i.url.trim())||[];return items.length?items:photos.map(url=>({type:'photo' as const,url,focalX:50,focalY:50}));},[media,photos]);
 const poster=videoPreview(safeVideoUrl||undefined),preview=videoPreview(safeVideoUrl||undefined,'preview');
 const images:PropertyMediaItem[]=[...photoMedia];if(preview&&photoMedia.length<2)images.push({type:'photo',url:preview,caption:'Fotograma del recorrido'});
 const [index,setIndex]=useState(0),[video,setVideo]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 const count=images.length;const primary=images[0]?.url||fallbackImage;
 function openPhoto(i:number){setIndex(i);setVideo(false);dialog.current?.showModal();}
 function openVideo(){setVideo(true);dialog.current?.showModal();}
 function close(){dialog.current?.close();if(locationHash()==='#video')history.replaceState(null,'',window.location.pathname+window.location.search);}
 function locationHash(){return typeof window==='undefined'?'':window.location.hash;}
 useEffect(()=>{const change=()=>{if(window.location.hash==='#video'&&safeVideoUrl)openVideo();};change();window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[safeVideoUrl]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(!dialog.current?.open||video)return;if(e.key==='ArrowRight')setIndex(i=>(i+1)%count);if(e.key==='ArrowLeft')setIndex(i=>(i-1+count)%count);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[count,video]);
 return <>
 <section className={styles.gallery}>
  <div className={styles.galleryHead}><a className={styles.backLink} href="/alquiler">← Volver a propiedades</a><p>{location}</p><h1>{title}</h1>{facts}</div>
  <div className={`${styles.mediaLayout} ${safeVideoUrl?styles.withVideo:''}`}>
   <button className={styles.primaryPhotoCard} type="button" onClick={()=>openPhoto(0)} aria-label="Abrir foto principal"><img src={primary} alt={`${title}, foto principal`} style={{objectPosition:`${images[0]?.focalX??50}% ${images[0]?.focalY??50}%`}}/><span className={styles.photoLabel}>Foto principal</span></button>
   {images.length>1&&<button type="button" className={styles.sidePhotoCard} onClick={()=>openPhoto(1)} aria-label="Abrir vista de apoyo"><img src={images[1].url} alt={`${title}, vista de apoyo`}/><span className={styles.photoLabel}>{images[1].caption||'Ver más'}</span></button>}
   {safeVideoUrl&&<button type="button" className={styles.videoTile} onClick={openVideo} aria-label="Reproducir recorrido en video"><img src={poster||primary} alt="Vista previa del recorrido" onError={e=>{if(e.currentTarget.getAttribute('src')!==primary)e.currentTarget.src=primary;}}/><span className={styles.playCircle}>▷</span><span className={styles.videoCaption}><strong>Recorré la propiedad</strong><span>Ver video completo</span></span></button>}
  </div>
  <div className={styles.galleryActions}><button className={styles.moreMediaButton} type="button" onClick={()=>openPhoto(0)}>Ver fotos{count>1?` y vistas (${count})`:''}</button>{safeVideoUrl&&<button className={styles.videoMediaButton} type="button" onClick={openVideo}>▷ Ver recorrido en video</button>}</div>
 </section>
 <dialog ref={dialog} className={styles.mediaDialog} aria-label={video?'Recorrido en video':'Galería de fotos'} onClick={e=>{if(e.target===e.currentTarget)close();}} onClose={()=>{dialog.current?.querySelector('video')?.pause();setVideo(false);if(locationHash()==='#video')history.replaceState(null,'',window.location.pathname+window.location.search);}}>
  <button className={styles.closeButton} onClick={close} aria-label="Cerrar galería">×</button>
  {video&&safeVideoUrl?(embeddedVideoUrl?<iframe src={embeddedVideoUrl} title={`Video de ${title}`} allow="autoplay; fullscreen" allowFullScreen/>:<video key={safeVideoUrl} src={safeVideoUrl} controls autoPlay playsInline preload="metadata"/>):<img src={images[index]?.url||fallbackImage} alt={`${title}, ${images[index]?.caption||`foto ${index+1}`}`}/>}
  <p className={styles.mediaCaption}>{video?'Recorrido completo':images[index]?.caption||`Foto ${index+1} de ${count}`}</p>
  {!video&&count>1&&<div className={styles.dialogControls}><button onClick={()=>setIndex(i=>(i-1+count)%count)} aria-label="Foto anterior">←</button><span>{index+1} / {count}</span><button onClick={()=>setIndex(i=>(i+1)%count)} aria-label="Foto siguiente">→</button></div>}
 </dialog></>;
}
