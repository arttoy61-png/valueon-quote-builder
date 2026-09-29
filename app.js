(() => {
  const $ = (id) => document.getElementById(id);
  const ids = [
    'clientName','quoteNo','quoteDate','validity','productName','tagline','description',
    'spec','options','custom','moq','quantity','unitPrice','vatType','shipping','shippingNote','note'
  ];

  const defaults = {
    clientName:'업체명 입력',
    quoteNo:'VOM-20260929-01',
    validity:'발행일로부터 14일',
    productName:'354ml 손잡이형 머그',
    tagline:'일상에 자연스럽게 어울리는 컬러 머그',
    description:'첨부 이미지 기준으로 제품 사양과 공급 가능 옵션을 확인해 견적을 구성합니다.',
    spec:'354ml',
    options:'8 COLORS',
    custom:'로고 인쇄 · 포장 협의',
    moq:'생산 조건 확인 후 안내',
    quantity:'100',
    unitPrice:'5000',
    vatType:'separate',
    shipping:'0',
    shippingNote:'별도 협의',
    note:'단가는 수량, 옵션, 로고/인쇄, 포장 및 운송 조건에 따라 최종 확정됩니다.'
  };

  let imageData = '';
  let imageNatural = { width: 0, height: 0 };

  function todayISO() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0,10);
  }

  function parseNum(v) {
    const n = Number(String(v ?? '').replace(/,/g,''));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function money(n) {
    return '₩' + Math.round(n || 0).toLocaleString('ko-KR');
  }

  function calc() {
    const qty = parseNum($('quantity').value);
    const unit = parseNum($('unitPrice').value);
    const shipping = parseNum($('shipping').value);
    const vatType = $('vatType').value;

    let supply = qty * unit;
    let vat = 0;
    let goodsTotal = supply;

    if (vatType === 'separate') {
      vat = Math.round(supply * 0.1);
      goodsTotal = supply + vat;
    } else {
      const gross = supply;
      supply = Math.round(gross / 1.1);
      vat = gross - supply;
      goodsTotal = gross;
    }

    return {
      qty, unit, shipping, supply, vat,
      total: goodsTotal + shipping,
      vatType
    };
  }

  function value(id) {
    return $(id).value.trim();
  }

  function formatDate(v) {
    if (!v) return '-';
    const [y,m,d] = v.split('-');
    return y + '. ' + m + '. ' + d;
  }

  function updatePreview() {
    const c = calc();

    $('pvClient').textContent = value('clientName') || '-';
    $('pvQuoteNo').textContent = value('quoteNo') || '-';
    $('pvDate').textContent = formatDate($('quoteDate').value);
    $('pvValidity').textContent = value('validity') || '-';

    $('pvProductName').textContent = value('productName') || '제품명';
    $('pvProductRow').textContent = value('productName') || '제품명';
    $('pvTagline').textContent = value('tagline') || '';
    $('pvDescription').textContent = value('description') || '';
    $('pvSpec').textContent = value('spec') || '-';
    $('pvOptions').textContent = value('options') || '-';
    $('pvCustom').textContent = value('custom') || '-';
    $('pvMoq').textContent = value('moq') || '-';

    $('pvQty').textContent = c.qty.toLocaleString('ko-KR');
    $('pvUnit').textContent = money(c.unit);
    $('pvSupply').textContent = money(c.supply);
    $('pvVatType').textContent = c.vatType === 'separate' ? '별도 10%' : '단가에 포함';
    $('pvVat').textContent = money(c.vat);
    $('pvShippingNote').textContent = value('shippingNote') || '-';
    $('pvShipping').textContent = money(c.shipping);
    $('pvTotal').textContent = money(c.total);
    $('pvNote').textContent = value('note') || '';

    $('calcSupply').textContent = money(c.supply);
    $('calcVat').textContent = money(c.vat);
    $('calcShipping').textContent = money(c.shipping);
    $('calcTotal').textContent = money(c.total);
  }

  function setImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      imageData = e.target.result;
      const img = new Image();
      img.onload = () => {
        imageNatural = { width: img.naturalWidth, height: img.naturalHeight };
        $('pvImage').src = imageData;
        $('pvImage').hidden = false;
        $('imagePlaceholder').hidden = true;
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    imageData = '';
    imageNatural = { width: 0, height: 0 };
    $('pvImage').removeAttribute('src');
    $('pvImage').hidden = true;
    $('imagePlaceholder').hidden = false;
    $('productImage').value = '';
  }

  function resetForm() {
    Object.entries(defaults).forEach(([id,v]) => { if ($(id)) $(id).value = v; });
    $('quoteDate').value = todayISO();
    removeImage();
    updatePreview();
  }

  function safeFileName() {
    const client = value('clientName').replace(/[\\/:*?"<>|]/g,'_') || '업체';
    const product = value('productName').replace(/[\\/:*?"<>|]/g,'_') || '제품';
    return 'VALUEON_' + client + '_' + product + '_견적서';
  }

  async function exportPdf() {
    const btn = $('pdfBtn');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'PDF 만드는 중…';
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const paper = $('quotePaper');
      const oldTransform = paper.style.transform;
      const oldMargin = paper.style.marginBottom;
      paper.style.transform = 'none';
      paper.style.marginBottom = '0';

      const canvas = await html2canvas(paper, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      paper.style.transform = oldTransform;
      paper.style.marginBottom = oldMargin;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4', compress:true });
      const img = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(safeFileName() + '.pdf');
    } catch (e) {
      console.error(e);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  }

  function addText(slide, text, x, y, w, h, size, color, bold=false, align='left') {
    slide.addText(String(text ?? ''), {
      x,y,w,h,
      fontFace:'Malgun Gothic',
      fontSize:size,
      color,
      bold,
      margin:0,
      breakLine:false,
      valign:'mid',
      align,
      fit:'shrink'
    });
  }

  function addRect(slide, x,y,w,h, fill, line='FFFFFF') {
    slide.addShape('rect', {
      x,y,w,h,
      fill:{color:fill},
      line:{color:line, transparency: line === 'FFFFFF' ? 100 : 0, width:0.6}
    });
  }

  function containBox(boxW, boxH, iw, ih) {
    if (!iw || !ih) return {w:boxW,h:boxH,x:0,y:0};
    const r = Math.min(boxW/iw, boxH/ih);
    return { w:iw*r, h:ih*r, x:(boxW-iw*r)/2, y:(boxH-ih*r)/2 };
  }

  async function exportPptx() {
    const btn = $('pptBtn');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'PPTX 만드는 중…';

    try {
      const Ctor = window.PptxGenJS || window.pptxgen || window.pptxgenjs;
      if (!Ctor) throw new Error('PptxGenJS not loaded');

      const pptx = new Ctor();
      pptx.defineLayout({ name:'A4P', width:8.27, height:11.69 });
      pptx.layout = 'A4P';
      pptx.author = 'VALUEON MAKE';
      pptx.subject = 'Product Sourcing Quotation';
      pptx.title = safeFileName();
      pptx.company = 'VALUEON';
      pptx.lang = 'ko-KR';
      pptx.theme = {
        headFontFace:'Malgun Gothic',
        bodyFontFace:'Malgun Gothic',
        lang:'ko-KR'
      };

      const slide = pptx.addSlide();
      slide.background = { color:'FFFFFF' };

      const NAVY='052E72', BLUE='0D73F7', INK='1A2230', MUTED='687587', LINE='DBE2EC', SOFT='F4F7FB', SOFT2='EEF4FF', WHITE='FFFFFF';
      addRect(slide,0,0,8.27,0.08,BLUE);
      addText(slide,'VALUEON',0.52,0.25,1.45,0.38,23,NAVY,true);
      addText(slide,'MAKE',1.79,0.31,0.70,0.26,11,BLUE,false);
      addText(slide,'PRODUCT SOURCING QUOTATION',4.78,0.28,2.94,0.23,10,NAVY,true,'right');
      addText(slide,'제품 소싱 견적서',4.78,0.53,2.94,0.22,10,MUTED,false,'right');
      addRect(slide,0.52,0.82,7.20,0.01,LINE);

      addText(slide,'MAKE BY VALUEON',0.52,1.00,1.85,0.20,10,BLUE,true);
      addText(slide,'제품 소싱 견적서',0.52,1.23,2.95,0.46,25,INK,true);

      const meta = [
        ['수신', value('clientName') || '-'],
        ['견적번호', value('quoteNo') || '-'],
        ['견적일', formatDate($('quoteDate').value)],
        ['유효기간', value('validity') || '-']
      ];
      meta.forEach((m,i)=>{
        const col=i%2,row=Math.floor(i/2);
        const x=4.02+col*1.85,y=0.98+row*0.43;
        addRect(slide,x,y,0.69,0.34,SOFT2);
        addText(slide,m[0],x+0.08,y+0.03,0.54,0.27,10,NAVY,true);
        addRect(slide,x+0.69,y,1.12,0.34,WHITE,LINE);
        addText(slide,m[1],x+0.77,y+0.03,0.96,0.27,10,INK,false);
      });

      addRect(slide,0.52,1.92,3.55,4.08,SOFT,LINE);
      if (imageData) {
        const fit=containBox(3.25,3.78,imageNatural.width,imageNatural.height);
        slide.addImage({data:imageData,x:0.67+fit.x,y:2.07+fit.y,w:fit.w,h:fit.h});
      } else {
        addText(slide,'PRODUCT IMAGE',1.28,3.63,2.02,0.30,12,MUTED,true,'center');
        addText(slide,'제품 사진을 넣어주세요',1.22,3.97,2.14,0.24,10,MUTED,false,'center');
      }

      addText(slide,'PRODUCT SOURCING',4.34,2.02,1.85,0.20,10,BLUE,true);
      addText(slide,value('productName') || '제품명',4.34,2.28,3.10,0.66,22,NAVY,true);
      addText(slide,value('tagline'),4.34,2.96,3.10,0.38,11,INK,true);
      addText(slide,value('description'),4.34,3.42,3.10,0.78,10,MUTED,false);

      const specs=[
        ['SPEC',value('spec')],['OPTION',value('options')],
        ['CUSTOM',value('custom')],['MOQ',value('moq')]
      ];
      specs.forEach((sp,i)=>{
        const col=i%2,row=Math.floor(i/2);
        const x=4.34+col*1.59,y=4.54+row*0.78;
        addRect(slide,x,y,1.46,0.66,SOFT);
        addRect(slide,x,y,1.46,0.03,NAVY);
        addText(slide,sp[0],x+0.09,y+0.09,1.22,0.16,10,MUTED,true);
        addText(slide,sp[1] || '-',x+0.09,y+0.29,1.22,0.27,10,NAVY,true);
      });

      const c=calc();
      addText(slide,'QUOTATION',0.52,6.32,1.35,0.20,10,BLUE,true);
      addText(slide,'견적 금액',6.18,6.24,1.54,0.28,15,NAVY,true,'right');
      addRect(slide,0.52,6.61,7.20,0.025,NAVY);

      const cols=[0.52,3.69,4.57,5.94,7.72];
      const headers=['항목','수량','단가','금액'];
      addRect(slide,0.52,6.64,7.20,0.36,'F1F5FA');
      headers.forEach((h,i)=>addText(slide,h,cols[i]+0.10,6.69,(cols[i+1]-cols[i])-0.18,0.20,10,MUTED,true,i?'right':'left'));

      const rows=[
        [value('productName')||'제품명', c.qty.toLocaleString('ko-KR'), money(c.unit), money(c.supply)],
        ['VAT','',c.vatType==='separate'?'별도 10%':'단가에 포함',money(c.vat)],
        ['운송비','',value('shippingNote')||'-',money(c.shipping)]
      ];
      rows.forEach((row,ri)=>{
        const y=7.00+ri*0.52;
        addRect(slide,0.52,y,7.20,0.52,WHITE,LINE);
        row.forEach((t,i)=>addText(slide,t,cols[i]+0.10,y+0.08,(cols[i+1]-cols[i])-0.18,0.31,10.5,i===0?INK:MUTED,i===0,i?'right':'left'));
      });

      const totalY=8.62;
      addRect(slide,0.52,totalY,7.20,0.68,NAVY);
      addText(slide,'최종 견적 합계',0.68,totalY+0.14,2.35,0.34,12,WHITE,true);
      addText(slide,money(c.total),5.08,totalY+0.11,2.44,0.40,18,WHITE,true,'right');

      addText(slide,'견적 안내',0.52,9.64,0.94,0.24,10,BLUE,true);
      addText(slide,value('note'),1.48,9.58,5.95,0.62,10,MUTED,false);

      addRect(slide,0.52,10.78,7.20,0.01,LINE);
      addText(slide,'VALUEON MAKE',0.52,10.93,1.55,0.23,10,NAVY,true);
      addText(slide,'무엇이든 만들어드립니다.',5.47,10.93,2.25,0.23,10,MUTED,false,'right');

      await pptx.writeFile({ fileName:safeFileName()+'.pptx' });
    } catch(e) {
      console.error(e);
      alert('PPTX 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      btn.disabled=false;
      btn.textContent=old;
    }
  }

  ids.forEach((id) => {
    const el=$(id);
    if (!el) return;
    el.addEventListener('input',updatePreview);
    el.addEventListener('change',updatePreview);
  });

  $('productImage').addEventListener('change',(e)=>setImage(e.target.files?.[0]));
  $('removeImage').addEventListener('click',removeImage);
  $('resetBtn').addEventListener('click',resetForm);
  $('pdfBtn').addEventListener('click',exportPdf);
  $('pptBtn').addEventListener('click',exportPptx);

  const upload=$('.upload-box');
  ['dragenter','dragover'].forEach(ev=>upload.addEventListener(ev,(e)=>{
    e.preventDefault(); upload.classList.add('is-drag');
  }));
  ['dragleave','drop'].forEach(ev=>upload.addEventListener(ev,(e)=>{
    e.preventDefault(); upload.classList.remove('is-drag');
  }));
  upload.addEventListener('drop',(e)=>setImage(e.dataTransfer?.files?.[0]));

  $('quoteDate').value=todayISO();
  updatePreview();
})();