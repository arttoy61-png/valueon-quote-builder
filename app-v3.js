(() => {
  const $ = (id) => document.getElementById(id);
  const watched = [
    'clientName','quoteNo','quoteDate','validity','manager','contact',
    'productName','tagline','description','keywords','spec','size','material',
    'options','custom','moq','quantity','unitPrice','vatType','shipping',
    'shippingNote','note'
  ];

  const defaults = {
    clientName:'업체명 입력',
    quoteNo:'VOM-20260929-01',
    validity:'발행일로부터 14일',
    manager:'담당자 입력',
    contact:'연락처 입력',
    productName:'354ml 손잡이형 머그',
    tagline:'일상에 자연스럽게 어울리는 컬러 머그',
    description:'감각적인 컬러와 실용적인 용량으로 브랜드 굿즈, 판촉물, 카페 상품 등 다양한 용도로 활용 가능합니다.',
    keywords:'카페 · 기업 굿즈 · 브랜드 상품 · 판촉물 · 맞춤 제작',
    spec:'354ml (12oz)',
    size:'약 Ø85 × H98 mm',
    material:'세라믹(도자기)',
    options:'8 COLORS',
    custom:'로고 인쇄 · 포장 협의',
    moq:'MOQ 500개부터 (협의 가능)',
    quantity:'100',
    unitPrice:'5000',
    vatType:'separate',
    shipping:'0',
    shippingNote:'별도 협의',
    note:'단가는 수량, 옵션, 로고/인쇄, 포장 및 운송 조건에 따라 최종 확정됩니다.'
  };

  let imageData = '';
  let imageNatural = { width:0, height:0 };
  let imageLayout = 'square';

  function todayISO(){
    const d=new Date();
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function parseNum(v){
    const n=Number(String(v ?? '').replace(/,/g,''));
    return Number.isFinite(n)&&n>0?n:0;
  }
  function money(n){ return '₩'+Math.round(n||0).toLocaleString('ko-KR'); }
  function value(id){ return ($(id)?.value || '').trim(); }
  function formatDate(v){
    if(!v) return '-';
    const [y,m,d]=v.split('-');
    return `${y}. ${m}. ${d}`;
  }
  function calc(){
    const qty=parseNum($('quantity').value);
    const unit=parseNum($('unitPrice').value);
    const shipping=parseNum($('shipping').value);
    const vatType=$('vatType').value;
    let supply=qty*unit, vat=0, goodsTotal=supply;
    if(vatType==='separate'){
      vat=Math.round(supply*.1);
      goodsTotal=supply+vat;
    }else{
      const gross=supply;
      supply=Math.round(gross/1.1);
      vat=gross-supply;
      goodsTotal=gross;
    }
    return {qty,unit,shipping,supply,vat,total:goodsTotal+shipping,vatType};
  }
  function keywordList(){
    return value('keywords').split(/[·,\n]+/).map(s=>s.trim()).filter(Boolean).slice(0,6);
  }
  function renderKeywords(){
    const box=$('pvKeywords');
    box.innerHTML='';
    keywordList().forEach(t=>{
      const s=document.createElement('span');
      s.textContent=t;
      box.appendChild(s);
    });
  }
  function classifyImage(w,h){
    const r=w/h;
    if(r>=1.25) return 'landscape';
    if(r<=0.8) return 'portrait';
    return 'square';
  }
  function applyImageLayout(layout){
    imageLayout=layout;
    const el=$('productDetail');
    el.classList.remove('image-landscape','image-portrait','image-square');
    el.classList.add('image-'+layout);
  }

  function updatePreview(){
    const c=calc();
    $('pvClient').textContent=value('clientName')||'-';
    $('pvQuoteNo').textContent=value('quoteNo')||'-';
    $('pvDate').textContent=formatDate($('quoteDate').value);
    $('pvValidity').textContent=value('validity')||'-';
    $('pvManager').textContent=value('manager')||'-';
    $('pvContact').textContent=value('contact')||'-';

    $('pvProductName').textContent=value('productName')||'제품명';
    $('pvProductRow').textContent=value('productName')||'제품명';
    $('pvTagline').textContent=value('tagline')||'';
    $('pvDescription').textContent=value('description')||'';
    $('pvSpec').textContent=value('spec')||'-';
    $('pvSize').textContent=value('size')||'-';
    $('pvMaterial').textContent=value('material')||'-';
    $('pvOptions').textContent=value('options')||'-';
    $('pvCustom').textContent=value('custom')||'-';
    $('pvMoq').textContent=value('moq')||'-';
    renderKeywords();

    $('pvQty').textContent=c.qty.toLocaleString('ko-KR');
    $('pvUnit').textContent=money(c.unit);
    $('pvSupply').textContent=money(c.supply);
    $('pvVatType').textContent=c.vatType==='separate'?'별도 10%':'단가에 포함';
    $('pvVat').textContent=money(c.vat);
    $('pvShippingNote').textContent=value('shippingNote')||'-';
    $('pvShipping').textContent=money(c.shipping);
    $('pvTotal').textContent=money(c.total);
    $('pvNote').textContent=value('note')||'';

    $('calcSupply').textContent=money(c.supply);
    $('calcVat').textContent=money(c.vat);
    $('calcShipping').textContent=money(c.shipping);
    $('calcTotal').textContent=money(c.total);
  }

  function setImage(file){
    if(!file || !file.type.startsWith('image/')) return;
    const reader=new FileReader();
    reader.onload=e=>{
      imageData=e.target.result;
      const img=new Image();
      img.onload=()=>{
        imageNatural={width:img.naturalWidth,height:img.naturalHeight};
        applyImageLayout(classifyImage(img.naturalWidth,img.naturalHeight));
        $('pvImage').src=imageData;
        $('pvImage').hidden=false;
        $('imagePlaceholder').hidden=true;
      };
      img.src=imageData;
    };
    reader.readAsDataURL(file);
  }
  function removeImage(){
    imageData='';
    imageNatural={width:0,height:0};
    applyImageLayout('square');
    $('pvImage').removeAttribute('src');
    $('pvImage').hidden=true;
    $('imagePlaceholder').hidden=false;
    $('productImage').value='';
  }
  function resetForm(){
    Object.entries(defaults).forEach(([id,v])=>{ if($(id)) $(id).value=v; });
    $('quoteDate').value=todayISO();
    removeImage();
    updatePreview();
  }
  function safeFileName(){
    const clean=s=>s.replace(/[\\/:*?"<>|]/g,'_');
    return 'VALUEON_'+clean(value('clientName')||'업체')+'_'+clean(value('productName')||'제품')+'_견적서';
  }

  async function exportPdf(){
    const btn=$('pdfBtn'), old=btn.textContent;
    btn.disabled=true; btn.textContent='PDF 만드는 중…';
    try{
      if(document.fonts?.ready) await document.fonts.ready;
      const paper=$('quotePaper');
      const oldTransform=paper.style.transform, oldMargin=paper.style.marginBottom;
      paper.style.transform='none'; paper.style.marginBottom='0';
      const canvas=await html2canvas(paper,{scale:2.2,useCORS:true,backgroundColor:'#fff',logging:false});
      paper.style.transform=oldTransform; paper.style.marginBottom=oldMargin;
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      pdf.addImage(canvas.toDataURL('image/jpeg',.96),'JPEG',0,0,210,297,undefined,'FAST');
      pdf.save(safeFileName()+'.pdf');
    }catch(e){
      console.error(e); alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }finally{ btn.disabled=false; btn.textContent=old; }
  }

  function addText(slide,text,x,y,w,h,size,color,bold=false,align='left'){
    slide.addText(String(text??''),{x,y,w,h,fontFace:'Malgun Gothic',fontSize:size,color,bold,margin:0,valign:'mid',align,fit:'shrink'});
  }
  function addRect(slide,x,y,w,h,fill,line='FFFFFF'){
    slide.addShape('rect',{x,y,w,h,fill:{color:fill},line:{color:line,transparency:line==='FFFFFF'?100:0,width:.6}});
  }
  function containBox(boxW,boxH,iw,ih){
    if(!iw||!ih) return {w:boxW,h:boxH,x:0,y:0};
    const r=Math.min(boxW/iw,boxH/ih);
    return {w:iw*r,h:ih*r,x:(boxW-iw*r)/2,y:(boxH-ih*r)/2};
  }

  async function exportPptx(){
    const btn=$('pptBtn'), old=btn.textContent;
    btn.disabled=true; btn.textContent='PPTX 만드는 중…';
    try{
      const Ctor=window.PptxGenJS||window.pptxgen||window.pptxgenjs;
      if(!Ctor) throw new Error('PptxGenJS not loaded');
      const pptx=new Ctor();
      pptx.defineLayout({name:'A4P',width:8.27,height:11.69});
      pptx.layout='A4P';
      pptx.author='VALUEON MAKE'; pptx.company='VALUEON'; pptx.lang='ko-KR';
      pptx.theme={headFontFace:'Malgun Gothic',bodyFontFace:'Malgun Gothic',lang:'ko-KR'};
      const s=pptx.addSlide(); s.background={color:'FFFFFF'};
      const NAVY='052E72',BLUE='0D73F7',INK='1A2230',MUTED='687587',LINE='D7E0EB',SOFT='F2F6FA',WHITE='FFFFFF';

      addRect(s,0,0,8.27,.07,BLUE);
      addText(s,'VALUEON',.48,.22,1.45,.34,22,NAVY,true);
      addText(s,'MAKE BY VALUEON',.49,.56,1.38,.16,10,NAVY,true);
      addText(s,'좋은 아이디어가, 더 좋은 제품이 됩니다.',5.05,.28,2.72,.25,10,NAVY,false,'right');
      addRect(s,.48,.82,7.29,.01,LINE);

      addText(s,'PRODUCT SOURCING QUOTATION',.48,1.00,2.4,.22,10,BLUE,true);
      addText(s,value('productName')||'제품명',.48,1.24,3.55,.55,24,NAVY,true);
      addText(s,value('tagline'),.48,1.82,3.55,.30,12,INK,true);
      addText(s,value('description'),.48,2.18,3.55,.48,10.5,MUTED,false);

      let tx=.48;
      keywordList().slice(0,5).forEach(k=>{
        const w=Math.min(1.15,Math.max(.68,.12*k.length+.35));
        addRect(s,tx,2.72,w,.30,SOFT);
        addText(s,k,tx+.08,2.77,w-.16,.18,10,NAVY,false,'center');
        tx+=w+.08;
      });

      const meta=[
        ['수신',value('clientName')||'-'],['견적번호',value('quoteNo')||'-'],
        ['견적일',formatDate($('quoteDate').value)],['유효기간',value('validity')||'-'],
        ['담당자',value('manager')||'-'],['연락처',value('contact')||'-']
      ];
      meta.forEach((m,i)=>{
        const y=.98+i*.35;
        addRect(s,4.55,y,.76,.35,SOFT,LINE);
        addText(s,m[0],4.65,y+.04,.56,.25,10,NAVY,true);
        addRect(s,5.31,y,2.46,.35,WHITE,LINE);
        addText(s,m[1],5.43,y+.04,2.20,.25,10,INK,false);
      });

      let imgX=.48,imgW=3.42,specX=4.18,specW=3.59;
      if(imageLayout==='landscape'){imgW=3.78;specX=4.53;specW=3.24;}
      if(imageLayout==='portrait'){imgW=2.95;specX=3.73;specW=4.04;}
      const imgY=3.27,imgH=3.30;
      addRect(s,imgX,imgY,imgW,imgH,'F5F7FA',LINE);
      if(imageData){
        const fit=containBox(imgW-.18,imgH-.18,imageNatural.width,imageNatural.height);
        s.addImage({data:imageData,x:imgX+.09+fit.x,y:imgY+.09+fit.y,w:fit.w,h:fit.h});
      }else{
        addText(s,'PRODUCT IMAGE',imgX+.3,imgY+1.42,imgW-.6,.25,12,MUTED,true,'center');
        addText(s,'제품 사진을 넣어주세요',imgX+.3,imgY+1.72,imgW-.6,.22,10,MUTED,false,'center');
      }

      addText(s,'제품 사양',specX,imgY,specW,.28,15,NAVY,true);
      addRect(s,specX,imgY+.34,specW,.02,NAVY);
      const specs=[
        ['용량',value('spec')],['사이즈',value('size')],['재질',value('material')],
        ['옵션',value('options')],['커스텀',value('custom')],['최소주문수량',value('moq')]
      ];
      specs.forEach((sp,i)=>{
        const y=imgY+.39+i*.485;
        addRect(s,specX,y,1.10,.485,SOFT,LINE);
        addText(s,sp[0],specX+.10,y+.08,.86,.30,10,NAVY,true);
        addRect(s,specX+1.10,y,specW-1.10,.485,WHITE,LINE);
        addText(s,sp[1]||'-',specX+1.23,y+.08,specW-1.38,.30,10.5,INK,false);
      });

      const c=calc();
      addText(s,'QUOTATION',.48,6.86,1.12,.20,10,BLUE,true);
      addText(s,'견적 금액',1.60,6.83,1.20,.24,13,NAVY,true);
      addRect(s,.48,7.12,7.29,.02,NAVY);
      const cols=[.48,3.68,4.64,5.95,7.77];
      ['항목','수량','단가','금액'].forEach((h,i)=>{
        addRect(s,cols[i],7.15,cols[i+1]-cols[i],.34,SOFT,LINE);
        addText(s,h,cols[i]+.10,7.20,cols[i+1]-cols[i]-.20,.22,10,NAVY,true,i?'right':'left');
      });
      const rows=[
        [value('productName')||'제품명',c.qty.toLocaleString('ko-KR'),money(c.unit),money(c.supply)],
        ['VAT (부가세)','',c.vatType==='separate'?'별도 10%':'단가에 포함',money(c.vat)],
        ['운송비','',value('shippingNote')||'-',money(c.shipping)]
      ];
      rows.forEach((r,ri)=>{
        const y=7.49+ri*.43;
        r.forEach((t,i)=>{
          addRect(s,cols[i],y,cols[i+1]-cols[i],.43,WHITE,LINE);
          addText(s,t,cols[i]+.10,y+.07,cols[i+1]-cols[i]-.20,.28,10.5,i===0?INK:MUTED,i===0,i?'right':'left');
        });
      });

      addRect(s,.48,8.87,7.29,.72,SOFT);
      addText(s,'견적 안내',.63,9.00,.78,.24,11,NAVY,true);
      addText(s,value('note'),1.48,8.96,6.08,.33,10.5,MUTED,false);

      addRect(s,.48,9.74,7.29,.64,NAVY);
      addText(s,'최종 견적 합계',.66,9.88,2.4,.34,16,WHITE,true);
      addText(s,money(c.total),5.15,9.85,2.42,.38,20,WHITE,true,'right');

      addRect(s,.48,10.63,7.29,.01,LINE);
      addText(s,'VALUEON MAKE',.48,10.78,1.55,.24,10.5,NAVY,true);
      addText(s,'굿즈 · 패키지 · 생활용품 · 브랜드 제작',2.50,10.78,3.20,.24,10,MUTED,false,'center');
      addText(s,'무엇이든 만들어드립니다.',5.78,10.78,1.99,.24,10,MUTED,false,'right');

      await pptx.writeFile({fileName:safeFileName()+'.pptx'});
    }catch(e){
      console.error(e); alert('PPTX 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }finally{btn.disabled=false;btn.textContent=old;}
  }

  watched.forEach(id=>{
    const el=$(id);
    if(!el) return;
    el.addEventListener('input',updatePreview);
    el.addEventListener('change',updatePreview);
  });
  $('productImage').addEventListener('change',e=>setImage(e.target.files?.[0]));
  $('removeImage').addEventListener('click',removeImage);
  $('resetBtn').addEventListener('click',resetForm);
  $('pdfBtn').addEventListener('click',exportPdf);
  $('pptBtn').addEventListener('click',exportPptx);

  const upload=document.querySelector('.upload-box');
  ['dragenter','dragover'].forEach(ev=>upload.addEventListener(ev,e=>{e.preventDefault();upload.classList.add('is-drag')}));
  ['dragleave','drop'].forEach(ev=>upload.addEventListener(ev,e=>{e.preventDefault();upload.classList.remove('is-drag')}));
  upload.addEventListener('drop',e=>setImage(e.dataTransfer?.files?.[0]));

  $('quoteDate').value=todayISO();
  applyImageLayout('square');
  updatePreview();
})();