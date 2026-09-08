const type=document.getElementById("gbType");
const frame=document.getElementById("gbFrame");

const pages={
  "antar-bank":"/generate-bukti-antar-bank.html?v=54.0.0",
  "sesama-bca":"/generate-bukti-sesama-bca.html?v=54.0.0"
};

type.addEventListener("change",()=>{
  const next=pages[type.value];
  if(next) frame.src=next;
});
