// El imán actúa durante el arrastre; el teclado permite ajustes precisos.
(()=>{
 const defaults={'comp-scale':100,'comp-x':0,'comp-y':0,'type-size':INITIAL.typeSize,'icon-size':INITIAL.iconSize,'icon-angle':INITIAL.angle};
 for(const input of document.querySelectorAll('input[type="range"]')){
  const initial=defaults[input.id]??Number(input.defaultValue||input.value);let dragging=false;
  input.dataset.magnetDefault=initial;
  const track=document.createElement('span');track.className='magnetic-range';input.parentNode.insertBefore(track,input);track.append(input);
  function marker(){const min=Number(input.min||0),max=Number(input.max||100),ratio=(initial-min)/(max-min||1);track.style.setProperty('--magnet-position',String(Math.max(0,Math.min(1,ratio))));input.classList.toggle('at-default',Number(input.value)===initial);}
  function release(){dragging=false;}
  input.addEventListener('pointerdown',()=>{dragging=true;});
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
  input.addEventListener('input',()=>{const min=Number(input.min||0),max=Number(input.max||100),step=Number(input.step)||1,threshold=Math.max(step*1.1,(max-min)*.018);if(dragging&&Math.abs(Number(input.value)-initial)<=threshold)input.value=String(initial);marker();},true);
  input.addEventListener('dblclick',()=>{input.value=String(initial);input.dispatchEvent(new Event('input',{bubbles:true}));});
  new MutationObserver(marker).observe(input,{attributes:true,attributeFilter:['min','max']});marker();
 }
})();
