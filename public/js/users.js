const urlBase = "http://localhost:8888/api";
const modalLogin = document.getElementById("modalLogin");
const bsModalLogin = new bootstrap.Modal(modalLogin, (backdrop = "static")); // Pode passar opções
const modalRegistar = document.getElementById("modalRegistar");
const bsModalRegistar = new bootstrap.Modal(
  modalRegistar,
  (backdrop = "static")
); // Pode passar opções

const btnModalLogin = document.getElementById("btnModalLogin");
const btnModalRegistar = document.getElementById("btnModalRegistar");
const btnLogoff = document.getElementById("btnLogoff");
const pRegistar = document.getElementById("pRegistar");

pRegistar.addEventListener("click", () => {
  bsModalLogin.hide();
  chamaModalRegistar();
});

modalLogin.addEventListener("shown.bs.modal", () => {
  document.getElementById("usernameLogin").focus();
});
btnModalLogin.addEventListener("click", () => {
  bsModalLogin.show();
});
btnModalRegistar.addEventListener("click", () => {
  chamaModalRegistar();
});

function chamaModalRegistar() {
  document.getElementById("btnSubmitRegistar").style.display = "block";
  document.getElementById("btnCancelaRegistar").innerHTML = "Cancelar";
  bsModalRegistar.show();
}

btnLogoff.addEventListener("click", () => {
  localStorage.removeItem("token");
  document.getElementById("btnLogoff").style.display = "none";
  window.location.replace("index.html");
});

function validaRegisto() {
  let email = document.getElementById("usernameRegistar").value; // email é validado pelo próprio browser
  let senha = document.getElementById("senhaRegistar").value; // tem de ter uma senha
  const statReg = document.getElementById("statusRegistar");
  if (senha.length < 4) {
    document.getElementById("passErroLogin").innerHTML =
      "A senha tem de ter ao menos 4 carateres";
    return;
  }
  fetch(`${urlBase}/registar`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: `email=${email}&password=${senha}`,
  })
    .then(async (response) => {
      if (!response.ok) {
        erro = response.statusText;
        statReg.innerHTML = response.statusText;
        throw new Error(erro);
      }
      result = await response.json();
      console.log(result.message);
      statReg.innerHTML = result.message;
      document.getElementById("btnSubmitRegistar").style.display = "none";
      document.getElementById("btnCancelaRegistar").innerHTML =
        "Fechar este diálogo";
    })
    .catch((error) => {
      document.getElementById(
        "statusRegistar"
      ).innerHTML = `Pedido falhado: ${error}`;
    });
}

function validaLogin() {
  let email = document.getElementById("usernameLogin").value; // email é validado pelo próprio browser
  let senha = document.getElementById("senhaLogin").value; // tem de ter uma senha
  if (senha.length < 4) {
    document.getElementById("passErroLogin").innerHTML =
      "A senha tem de ter ao menos 4 carateres";
    return;
  }
  const statLogin = document.getElementById("statusLogin");

  fetch(`${urlBase}/login`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST", // o login não vai criar nada, só ver se o user existe e a pass está correta
    body: `email=${email}&password=${senha}`,
  })
    .then(async (response) => {
      if (!response.ok) {
        erro = await response.json();
        throw new Error(erro.msg);
      }
      result = await response.json();
      console.log(result.accessToken);
      const token = result.accessToken;
      localStorage.setItem("token", token);
      document.getElementById("statusLogin").innerHTML = "Sucesso!";
      document.getElementById("btnLoginClose").click();
    })
    .catch(async (error) => {
      statLogin.innerHTML = error;
    });
}

async function loadAll () {
  const sitesNews = document.getElementById("sites");
  let url = urlBase + "/sites";
  let text = "";
  //var myHeaders = new Headers();
  const token = localStorage.token;
  const myInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    },
  };
  const myRequest = new Request(url, myInit); 

  sitesNews.innerHTML = "";
  console.log(url)
  await fetch(myRequest).then(async function (response) {
      if(!response.ok) {
          sitesNews.innerHTML = "Não há noticias!";
      } else {
          const sites = await response.json();
          for (const article of sites) {
              text +=`
                      <hr><div>
              <h4 style="width:100%">${article.title}</h4>
              URL: <a href="${article.url}">${article.url}</a></br>
              Source: ${article.source}</br>
              
              </div>`;
          }
          sitesNews.innerHTML = text;
      }
  });

}

async function searchById(siteId) {
  //const urlBase = "http://localhost:8888/sites";
  const siteNews = document.getElementById("sites");
  const tag = document.getElementById("tag").value;

  let text = "";
  let myHeaders = new Headers();
  let url = urlBase + "/sites" + "/" + tag;

  
  siteNews.innerHTML = "";
  console.log(url)  
  const token = localStorage.token;
  const myInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    },
  };
  const myRequest = new Request(url, myInit); 

  await fetch(myRequest).then(async function (response) {
      if(!response.ok) {
          siteNews.innerHTML = "Não há noticias!";
      } else {
          const sites = await response.json();
          for (const article of sites) {
              text +=`
                      <hr><div>
              <h4>${article.title}</h4>
              URL: <a href="${article.url}">${article.url}</a></br>
              Source: ${article.source}</br>
              </div>`;
          }
          siteNews.innerHTML = text;
      }
  });
}

