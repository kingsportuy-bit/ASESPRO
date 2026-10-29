import type { PropertyListing } from '@/lib/properties';
import styles from './PropertyFacts.module.css';
const paths={bed:'M3 20V7m0 6h18v7M3 9h5a3 3 0 0 1 3 3v1m0-4h7a3 3 0 0 1 3 3v1',bath:'M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3ZM6 12V5a2 2 0 0 1 4 0m-3 15v2m10-2v2',area:'M4 4h16v16H4V4Zm0 5h4m8 11v-4',garage:'M3 20V9l9-6 9 6v11M7 20V10h10v10M7 14h10m-10 3h10'};
export function PropertyFacts({property,compact=false}:{property:PropertyListing;compact?:boolean}):JSX.Element{
 const facts:Array<{icon:keyof typeof paths;text:string}>=[];
 if(property.bedrooms!==undefined)facts.push({icon:'bed',text:property.bedrooms===0?'Monoambiente':`${property.bedrooms} ${property.bedrooms===1?'dormitorio':'dormitorios'}`});
 if(property.bathrooms)facts.push({icon:'bath',text:`${property.bathrooms} ${property.bathrooms===1?'baño':'baños'}`});
 if(property.areaM2)facts.push({icon:'area',text:`${property.areaM2} m²`});
 if(property.amenities?.garage)facts.push({icon:'garage',text:'Cochera'});
 return <div className={`${styles.facts} ${compact?styles.factsCompact:''}`}>{facts.map(f=><span key={f.icon} className={styles.fact}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[f.icon]}/></svg>{f.text}</span>)}{property.amenities?.patio&&<span className={styles.fact}>Patio</span>}</div>;
}
