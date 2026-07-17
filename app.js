(function(){
  "use strict";

  var currentBasicMode = "speed";
  function id(x){ return document.getElementById(x); }
  function num(x){ return parseFloat(id(x).value); }
  function positive(){
    for(var i=0;i<arguments.length;i++){
      if(!Number.isFinite(arguments[i]) || arguments[i] <= 0) return false;
    }
    return true;
  }
  function pad(n){ return n < 10 ? "0"+n : String(n); }
  function hmToMin(value){
    if(!value) return NaN;
    var p=value.split(":");
    return Number(p[0])*60+Number(p[1]);
  }
  function minToClock(value){
    var m=Math.round(value);
    m=((m%1440)+1440)%1440;
    return pad(Math.floor(m/60))+":"+pad(m%60);
  }
  function durationText(minutes){
    var total=Math.round(minutes);
    var h=Math.floor(total/60), m=total%60;
    if(h && m) return h+" ساعة و"+m+" دقيقة";
    if(h) return h+" ساعة";
    return m+" دقيقة";
  }
  function showResult(el,html){ el.className="result show"; el.innerHTML=html; }
  function clearResult(el){ el.className="result"; el.innerHTML=""; }
  function isDay(minute,first,last){
    var t=((minute%1440)+1440)%1440;
    return first <= last ? (t>=first && t<last) : (t>=first || t<last);
  }
  function splitTravel(start,distance,daySpeed,nightSpeed,first,last){
    var t=start, remaining=distance, dayMin=0, nightMin=0, dayKm=0, nightKm=0, guard=0;
    while(remaining>0.000001 && guard++<10000){
      var day=isDay(t,first,last);
      var speed=day?daySpeed:nightSpeed;
      var tod=((t%1440)+1440)%1440;
      var boundary;
      if(day){
        boundary=t+(last-tod);
      }else if(tod<first){
        boundary=t+(first-tod);
      }else{
        boundary=t+((1440-tod)+first);
      }
      var available=Math.max(0,boundary-t);
      if(available<0.000001) available=1440;
      var possible=speed*(available/60);
      var usedKm=Math.min(remaining,possible);
      var usedMin=(usedKm/speed)*60;
      if(day){dayKm+=usedKm;dayMin+=usedMin;}else{nightKm+=usedKm;nightMin+=usedMin;}
      remaining-=usedKm;
      t+=usedMin;
      if(remaining>0.000001 && usedKm>=possible-0.000001) t=boundary;
    }
    return {end:t,dayMin:dayMin,nightMin:nightMin,dayKm:dayKm,nightKm:nightKm,totalMin:dayMin+nightMin};
  }

  document.querySelectorAll(".tab").forEach(function(btn){
    btn.addEventListener("click",function(){
      document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active");});
      document.querySelectorAll(".panel").forEach(function(x){x.classList.remove("active");});
      btn.classList.add("active");
      id("panel-"+btn.dataset.tab).classList.add("active");
    });
  });

  id("calcPassBtn").addEventListener("click",function(){
    var cars=num("pCars"),speed=num("pSpeed"),density=num("pDensity");
    if(!positive(cars,speed,density)){
      showResult(id("passResult"),'<span class="error">أدخل أرقامًا صحيحة أكبر من صفر.</span>');return;
    }
    var a=Math.ceil((cars*60)/(speed*density));
    var b=Math.ceil((cars*2)/25);
    showResult(id("passResult"),'<div>زمن المرور</div><div class="big">'+(a+b)+' دقيقة</div><div>الجزء الأول: '+a+' دقيقة — الجزء الثاني: '+b+' دقيقة</div>');
  });
  id("clearPassBtn").addEventListener("click",function(){
    ["pCars","pSpeed","pDensity"].forEach(function(x){id(x).value="";});clearResult(id("passResult"));
  });

  id("calcDayNightBtn").addEventListener("click",function(){
    var start=id("dnStart").value,dist=num("dnDistance"),ds=num("dnDaySpeed"),ns=num("dnNightSpeed");
    var first=id("dnFirstLight").value,last=id("dnLastLight").value;
    if(!start||!first||!last||!positive(dist,ds,ns)){
      showResult(id("dayNightResult"),'<span class="error">أكمل جميع البيانات بقيم صحيحة.</span>');return;
    }
    var r=splitTravel(hmToMin(start),dist,ds,ns,hmToMin(first),hmToMin(last));
    showResult(id("dayNightResult"),'<div>النتيجة</div><div class="big">الوصول '+minToClock(r.end)+'</div><div>زمن السير: '+durationText(r.totalMin)+'</div><div>نهارًا: '+r.dayKm.toFixed(2)+' كم — '+r.dayMin.toFixed(2)+' دقيقة</div><div>ليلًا: '+r.nightKm.toFixed(2)+' كم — '+r.nightMin.toFixed(2)+' دقيقة</div>');
  });
  id("clearDayNightBtn").addEventListener("click",function(){
    ["dnDistance","dnDaySpeed","dnNightSpeed"].forEach(function(x){id(x).value="";});clearResult(id("dayNightResult"));
  });

  function setBasicMode(mode){
    currentBasicMode=mode;
    document.querySelectorAll(".operation").forEach(function(x){x.classList.toggle("active",x.dataset.mode===mode);});
    id("basicDistanceWrap").classList.toggle("hidden",mode==="distance");
    id("basicSpeedWrap").classList.toggle("hidden",mode==="speed");
    id("basicHoursWrap").classList.toggle("hidden",mode==="time");
    id("basicMinutesWrap").classList.toggle("hidden",mode==="time");
    id("calcBasicBtn").textContent=mode==="speed"?"احسب السرعة":mode==="distance"?"احسب المسافة":"احسب الزمن";
    clearResult(id("basicResult"));
  }
  document.querySelectorAll(".operation").forEach(function(btn){btn.addEventListener("click",function(){setBasicMode(btn.dataset.mode);});});
  id("calcBasicBtn").addEventListener("click",function(){
    var d=num("basicDistance"),s=num("basicSpeed");
    var h=parseFloat(id("basicHours").value)||0,m=parseFloat(id("basicMinutes").value)||0,total=h*60+m;
    if(currentBasicMode==="speed"){
      if(!positive(d,total)){showResult(id("basicResult"),'<span class="error">أدخل المسافة والزمن.</span>');return;}
      showResult(id("basicResult"),'<div>السرعة</div><div class="big">'+(d/(total/60)).toFixed(2)+' كم/ساعة</div>');
    }else if(currentBasicMode==="distance"){
      if(!positive(s,total)){showResult(id("basicResult"),'<span class="error">أدخل السرعة والزمن.</span>');return;}
      showResult(id("basicResult"),'<div>المسافة</div><div class="big">'+(s*(total/60)).toFixed(2)+' كم</div>');
    }else{
      if(!positive(d,s)){showResult(id("basicResult"),'<span class="error">أدخل المسافة والسرعة.</span>');return;}
      var mins=(d/s)*60;
      showResult(id("basicResult"),'<div>الزمن</div><div class="big">'+durationText(mins)+'</div><div>'+mins.toFixed(2)+' دقيقة</div>');
    }
  });
  id("clearBasicBtn").addEventListener("click",function(){
    ["basicDistance","basicSpeed"].forEach(function(x){id(x).value="";});
    id("basicHours").value="0";id("basicMinutes").value="0";clearResult(id("basicResult"));
  });

  function updateDirection(){
    var reverse=id("directionMode").value==="reverse";
    id("baseTimeText").textContent=reverse?"وقت الوصول":"وقت الانطلاق";
    id("calcDirectionBtn").textContent=reverse?"احسب عكسي":"احسب أمامي";
    clearResult(id("directionResult"));
  }
  id("directionMode").addEventListener("change",updateDirection);
  id("calcDirectionBtn").addEventListener("click",function(){
    var base=id("baseTime").value,d=num("directionDistance"),s=num("directionSpeed");
    if(!base||!positive(d,s)){showResult(id("directionResult"),'<span class="error">أدخل الوقت والمسافة والسرعة.</span>');return;}
    var total=(d/s)*60,reverse=id("directionMode").value==="reverse";
    var result=hmToMin(base)+(reverse?-total:total);
    showResult(id("directionResult"),'<div>'+(reverse?'وقت الانطلاق':'وقت الوصول')+'</div><div class="big">'+minToClock(result)+'</div><div>زمن السير: '+durationText(total)+'</div>');
  });
  id("clearDirectionBtn").addEventListener("click",function(){
    id("baseTime").value="13:30";id("directionDistance").value="";id("directionSpeed").value="";clearResult(id("directionResult"));
  });

  id("darkBtn").addEventListener("click",function(){
    document.body.classList.toggle("dark");
    id("darkBtn").textContent=document.body.classList.contains("dark")?"☀️ الوضع النهاري":"🌙 الوضع الليلي";
  });
  id("printBtn").addEventListener("click",function(){window.print();});
  id("shareBtn").addEventListener("click",function(){
    var text="حاسبة المسير";
    document.querySelectorAll(".result.show").forEach(function(x){text+="\n"+x.textContent.trim();});
    if(navigator.share){navigator.share({title:"حاسبة المسير",text:text}).catch(function(){});}
    else{
      var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");id("status").textContent="تم نسخ النتيجة";}catch(e){id("status").textContent="استخدم زر المشاركة في المتصفح";}
      document.body.removeChild(ta);setTimeout(function(){id("status").textContent="";},2500);
    }
  });

  setBasicMode("speed");updateDirection();
  if("serviceWorker" in navigator){
    window.addEventListener("load",function(){
      navigator.serviceWorker.register("./service-worker.js?v=8").then(function(reg){reg.update();}).catch(function(){});
    });
  }
})();
