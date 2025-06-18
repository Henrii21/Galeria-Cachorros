window.onload = () => {
  aplicarTemaAutomatico();
  carregarCachorro();
  carregarListaRacas();
  carregarFavoritos();
};

const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

function aplicarTemaAutomatico() {
  const salvo = localStorage.getItem('tema');
  if (salvo) {
    document.body.classList.toggle('dark-mode', salvo === 'escuro');
  } else {
    const preferencia = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', preferencia);
  }

  atualizarTextoBotaoTema();
}

function atualizarTextoBotaoTema() {
  const btn = document.getElementById('modoBtn');
  btn.textContent = document.body.classList.contains('dark-mode')
    ? '☀️ Modo Claro'
    : '🌙 Modo Escuro';
}

function alternarModo() {
  document.body.classList.toggle('dark-mode');
  const temaAtual = document.body.classList.contains('dark-mode') ? 'escuro' : 'claro';
  localStorage.setItem('tema', temaAtual);
  atualizarTextoBotaoTema();
}

function carregarCachorro() {
  mostrarSpinner(true);

  fetch('https://dog.ceo/api/breeds/image/random')
    .then(res => res.json())
    .then(data => {
      mostrarImagens([data.message]);
      const breed = extrairRacaDaUrl(data.message);
      document.getElementById('breedName').textContent = `Raça: ${breed}`;
    })
    .catch(() => alert('Erro ao carregar cachorro aleatório.'))
    .finally(() => mostrarSpinner(false));
}

function carregarListaRacas() {
  fetch('https://dog.ceo/api/breeds/list/all')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('breedSelect');
      select.innerHTML = '';

      Object.keys(data.message).forEach(raca => {
        const option = document.createElement('option');
        option.value = raca;
        option.textContent = traduzirRaca(raca);
        select.appendChild(option);
      });

      select.addEventListener('change', atualizarSubRacas);
      atualizarSubRacas();
    });
}

function atualizarSubRacas() {
  const raca = document.getElementById('breedSelect').value;
  const subSelect = document.getElementById('subBreedSelect');
  const subContainer = document.getElementById('subRacaContainer');

  fetch(`https://dog.ceo/api/breed/${raca}/list`)
    .then(res => res.json())
    .then(data => {
      subSelect.innerHTML = '';
      if (data.message.length > 0) {
        subContainer.classList.remove('hidden');
        data.message.forEach(sub => {
          const option = document.createElement('option');
          option.value = sub;
          option.textContent = `${traduzirRaca(sub)} (${traduzirRaca(raca)})`;
          subSelect.appendChild(option);
        });
      } else {
        subContainer.classList.add('hidden');
      }
    });
}

function carregarPorRaca() {
  const raca = document.getElementById('breedSelect').value;
  const subRaca = !document.getElementById('subRacaContainer').classList.contains('hidden')
    ? document.getElementById('subBreedSelect').value
    : null;

  let url = subRaca
    ? `https://dog.ceo/api/breed/${raca}/${subRaca}/images/random/3`
    : `https://dog.ceo/api/breed/${raca}/images/random/3`;

  mostrarSpinner(true);
  fetch(url)
    .then(res => res.json())
    .then(data => {
      mostrarImagens(data.message);
      const titulo = subRaca
        ? `${traduzirRaca(subRaca)} (${traduzirRaca(raca)})`
        : traduzirRaca(raca);
      document.getElementById('breedName').textContent = `Raça: ${titulo}`;
    })
    .catch(() => alert('Erro ao carregar imagens.'))
    .finally(() => mostrarSpinner(false));
}

function mostrarImagens(urls) {
  const galeria = document.getElementById('galeria');
  galeria.innerHTML = '';

  urls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Cachorro fofo';
    img.onclick = () => abrirEmTelaCheia(url);

    const wrapper = document.createElement('div');
    wrapper.classList.add('imagem-container');

    const btnFav = document.createElement('button');
    btnFav.innerHTML = favoritos.includes(url) ? '💖 Favoritar' : '🤍 Favoritar';
    btnFav.onclick = e => {
      e.stopPropagation();
      alternarFavorito(url, btnFav);
    };

    wrapper.appendChild(img);
    wrapper.appendChild(btnFav);
    galeria.appendChild(wrapper);
  });
}

function abrirEmTelaCheia(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100vw;height:100vh;
    background:rgba(0,0,0,0.9);display:flex;align-items:center;
    justify-content:center;z-index:9999;`;

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Cachorro';
  img.style.cssText = 'max-width:90%;max-height:90%;border:5px solid white;border-radius:10px';

  overlay.appendChild(img);
  overlay.onclick = () => document.body.removeChild(overlay);

  document.body.appendChild(overlay);
}

function mostrarSpinner(mostrar) {
  document.getElementById('spinner').classList.toggle('hidden', !mostrar);
}

function extrairRacaDaUrl(url) {
  const partes = url.split('/');
  const raca = partes[partes.indexOf('breeds') + 1].replace('-', ' ');
  return traduzirRaca(raca);
}

function alternarFavorito(url, botao) {
  const index = favoritos.indexOf(url);
  if (index >= 0) {
    favoritos.splice(index, 1);
    botao.innerHTML = '🤍 Favoritar';
  } else {
    favoritos.push(url);
    botao.innerHTML = '💖 Favoritar';
  }
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function carregarFavoritos() {
  const btn = document.createElement('button');
  btn.textContent = '⭐ Ver Favoritos';
  btn.onclick = () => {
    const galeria = document.getElementById('galeria');
    const mostrando = galeria.dataset.favoritos === 'true';

    if (!mostrando) {
      document.getElementById('breedName').textContent = '🐾 Favoritos';
      mostrarImagens(favoritos);
      galeria.dataset.favoritos = 'true';
      btn.textContent = '🔄 Voltar';
    } else {
      galeria.dataset.favoritos = 'false';
      carregarPorRaca();
      btn.textContent = '⭐ Ver Favoritos';
    }
  };
  document.querySelector('.container').appendChild(btn);
}

function traduzirRaca(raca) {
  const traducao = {
    affenpinscher: "Affenpinscher",
    african: "Africano",
    airedale: "Airedale",
    akita: "Akita",
    appenzeller: "Appenzeller",
    australian: "Australiano",
    basenji: "Basenji",
    beagle: "Beagle",
    bluetick: "Bluetick",
    borzoi: "Borzói",
    bouvier: "Bouvier",
    boxer: "Boxer",
    brabancon: "Brabançon",
    briard: "Briard",
    bulldog: "Bulldog",
    bullterrier: "Bull Terrier",
    cairn: "Cairn Terrier",
    cattledog: "Cão de Gado",
    chihuahua: "Chihuahua",
    chow: "Chow Chow",
    clumber: "Clumber Spaniel",
    cockapoo: "Cockapoo",
    collie: "Collie",
    coonhound: "Coonhound",
    corgi: "Corgi",
    cotondetulear: "Coton de Tuléar",
    dachshund: "Dachshund (Salsicha)",
    dalmatian: "Dálmata",
    dane: "Dinamarquês",
    deerhound: "Deerhound",
    dhole: "Dhole",
    dingo: "Dingo",
    doberman: "Doberman",
    elkhound: "Elkhound",
    entlebucher: "Entlebucher",
    eskimo: "Esquimó",
    finnish: "Finlandês",
    frise: "Bichon Frisé",
    germanshepherd: "Pastor Alemão",
    greyhound: "Greyhound",
    groenendael: "Groenendael",
    hound: "Cão de Caça",
    husky: "Husky Siberiano",
    keeshond: "Keeshond",
    kelpie: "Kelpie",
    komondor: "Komondor",
    kuvasz: "Kuvasz",
    labrador: "Labrador",
    leonberg: "Leonberger",
    lhasa: "Lhasa Apso",
    malamute: "Malamute",
    malinois: "Malinois",
    maltese: "Maltês",
    mastiff: "Mastim",
    mexicanhairless: "Pelado Mexicano",
    mix: "Misto",
    mountain: "Cão de Montanha",
    newfoundland: "Terra-nova",
    otterhound: "Otterhound",
    papillon: "Papillon",
    pekinese: "Pequinês",
    pembroke: "Corgi Pembroke",
    pinscher: "Pinscher",
    pitbull: "Pitbull",
    pointer: "Pointer",
    pomeranian: "Spitz Alemão (Pomerânia)",
    poodle: "Poodle",
    pug: "Pug",
    puggle: "Puggle",
    pyrenees: "Cão dos Pirineus",
    redbone: "Redbone",
    retriever: "Retriever",
    ridgeback: "Ridgeback",
    rottweiler: "Rottweiler",
    saluki: "Saluki",
    samoyed: "Samoyeda",
    schipperke: "Schipperke",
    schnauzer: "Schnauzer",
    setter: "Setter",
    sheepdog: "Cão Pastor",
    shiba: "Shiba Inu",
    shihtzu: "Shih Tzu",
    spaniel: "Spaniel",
    springer: "Springer Spaniel",
    stbernard: "São Bernardo",
    terrier: "Terrier",
    tervuren: "Tervuren",
    vizsla: "Vizsla",
    weimaraner: "Weimaraner",
    whippet: "Whippet",
    wolfhound: "Wolfhound",
  };

  return traducao[raca.toLowerCase()] || raca.charAt(0).toUpperCase() + raca.slice(1);
}
