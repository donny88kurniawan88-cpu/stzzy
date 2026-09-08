const type=document.getElementById("gbType");
const frame=document.getElementById("gbFrame");

const pages={
  "antar-bank":"/bukti-generator/generate-bukti-antar-bank.html?v=56.0.0",
  "sesama-bca":"/bukti-generator/generate-bukti-sesama-bca.html?v=56.0.0"
};

type.addEventListener("change",()=>{
  const next=pages[type.value];
  if(next) frame.src=next;
});
