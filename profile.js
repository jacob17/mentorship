//// DECLARATION ////
/// data source
if (!localStorage.getItem("seed")) { // set a static seed for each user so that every visit shows the same users
  localStorage.setItem("seed", Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5))
}
const seed = localStorage.getItem("seed")
const userURL = `https://randomuser.me/api/?results=48&seed=${seed}&noinfo`
const userProfile = {
  image: localStorage.getItem("image") || {},
  name: localStorage.getItem("username"),
  occupation: localStorage.getItem("useroccupation"),
  country: localStorage.getItem("usercountry")
}

// querySelector
// bootstrap
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
// navbar
const settings = document.querySelector("#settings")
// profile section
const profile = document.querySelector("#profile")
const editIcons = document.querySelectorAll(".icon")
// user list
const userList = document.querySelector(".card-list")
// modal
const userModal = document.querySelector("#userInfoModal")
const modalTitle = document.querySelector("#modalTitle")
const modalImg = document.querySelector("#modalImg")
const modalCard = document.querySelector('#modalCard')
const contact = document.querySelector('#contact')
const modalFav = document.querySelector('#modalFav')

/// data array
// positions are converted from values in randomuser API
const positionListData = ["Data Engineer", "Data Analyst", "Data Architect", "Campaign Analyst", "Scrum Master", "Solutions Architect", "Fullstack Developer", "Frontend Developer", "Machine Learning Engineer", "Mobile Developer", "DataOps Engineer", "Backend Developer", "DevOps Engineer", "Data Scientist", "MLOps Engineer", "QA Engineer", "UX Writer", "UX Researcher", "Talent Recruiter", "UX Designer", "Business Specialist", "Project Manager", "UI Designer", "Ilustrator and Designer"]
const users = []
let filterUsers = []
let filters = []
let favUsers = []
if (localStorage.getItem("favUsers")) {
  favUsers = JSON.parse(localStorage.getItem("favUsers"))
}
const heartColor = { white: "#ffffff", red: "#F16D6D" }

//////// CODE START ////////

// get users
axios.get(userURL).then((res) => {
  const results = res.data.results
  results.forEach(result => users.push(result))
  // 1st render
  processUsers(users)
  renderUsers(users.filter(user => favUsers.includes(user.login.salt))) // only store user id in localstorage
}).catch(function(error) {
  console.log(error);
})

//// EVENT LISTENER ////
// settings
settings.addEventListener('click', (e) => {
  if (e.target.innerText === "Get New Users"){
    // reset seed and get a new batch of users
    localStorage.removeItem("seed")
    window.location.reload()
  } else if (e.target.innerText === "Reset Favorite"){
    localStorage.removeItem("favUsers")
    favUsers = []
    filterUsers = []
    renderUsers(users)
  } else if (e.target.innerText === "Reset Profile Data"){
    localStorage.removeItem("image")
    localStorage.removeItem("username")
    localStorage.removeItem("useroccupation")
    localStorage.removeItem("usercountry")
    window.location.reload()
  }
})

// card: click heart to add to favorite & click card to show modal
userList.addEventListener('click', (e) => {
  const t = e.target
  if (t.closest(".fav")) {
    let heart = t.closest(".fav").children[0].children[0]
    if (heart.getAttribute("style") === "fill: " + heartColor.white) {
      // add to favorite
      heart.setAttribute('style', `fill: ${heartColor.red}`)
      favUsers.push(t.closest(".fav").parentElement.id)
    } else {
      // remove from favorite
      heart.setAttribute('style', `fill: ${heartColor.white}`)
      favUsers.splice(favUsers.findIndex(userId => userId === t.closest(".fav").parentElement.id), 1)
    }
    localStorage.setItem('favUsers', JSON.stringify(favUsers)) // store favorite again
  } else {
    // click card to show modal
    const card = t.closest(".card");
    if (card !== null) {
      const id = card.id
      renderModal(id)
    }
  }
})

// update profile from localstorage
document.querySelector("#image").parentElement.style = userProfile.image ? `background-image: url(${userProfile.image});` : "none"
document.querySelector("#username").innerText = userProfile.name ? userProfile.name : "Enter your name..."
document.querySelector("#useroccupation").innerText = userProfile.occupation ? userProfile.occupation : "Enter your occupation..."
document.querySelector("#usercountry").innerText = userProfile.country ? userProfile.country : "Enter your country..."

// icons show when hover in
editIcons.forEach(icon => {
  let parent = icon.closest(".display-data")
  parent.addEventListener('mouseenter', () => {
    icon.classList.remove("icon")
  })
  parent.addEventListener('mouseleave', () => {
    icon.classList.add("icon")
  })
})

// edit profile
profile.addEventListener('click', (e) => {
  const target = e.target
  const parent = target.closest('.list-group-item')
  const display = parent.firstElementChild
  const input = parent.lastElementChild
  const displayField = display.querySelector(".field")
  const inputField = input.querySelector(".form-control")
  if (target.classList.contains("fa-pen-to-square")) { // if clicked on edit icon
    display.classList.add("d-none") 
    input.classList.remove("d-none")
    // if display value is not placeholder (i.e. gotten from localstorage) then show it in input
    if (displayField.innerText !== inputField.placeholder) {
      inputField.value = displayField.innerText
    }
  }
  if (target.innerText === "Save") {
    if (inputField.value !== '') {
      localStorage.setItem(displayField.id, inputField.value)
      displayField.innerText = inputField.value
    }
    display.classList.remove("d-none")
    input.classList.add("d-none")
  }
})

// upload user photo
document.querySelector("#image").addEventListener("change", (e) => {
  if(e.target.files.length !== 0){
      const imgURL = window.URL.createObjectURL(e.target.files[0])
      toDataURL(imgURL, (e) => { // convert image input to JSON storable format
        localStorage.setItem('image', e)
      })
      e.target.parentElement.style.backgroundImage = `url(${imgURL})`
    }
}, false)

// modal: toggle add to favorite
modalFav.addEventListener('click', (e) => {
  const t = e.target
  if (modalFav.innerText === "Save") {
    favUsers.push(t.closest(".modal-content").querySelector(".card-title").id)
    modalFav.innerText = "Unsave"
    modalFav.classList.remove("btn-secondary")
    modalFav.classList.add("btn-info")
    localStorage.setItem('favUsers', JSON.stringify(favUsers))
  } else if (modalFav.innerText === "Unsave") {
    favUsers.splice(favUsers.findIndex(userId => userId === t.closest(".modal-content").querySelector(".card-title").id), 1)
    modalFav.innerText = "Save"
    modalFav.classList.remove("btn-info")
    modalFav.classList.add("btn-secondary")
    localStorage.setItem('favUsers', JSON.stringify(favUsers))
  }
  renderUsers(users.filter(user => favUsers.includes(user.login.salt)))
})

//// FUNCTIONS ////
// modify user list for use
function processUsers(users) {
  users.forEach((user) => {
    // original randomuser.me photos are too low in resolution
    // I hosted my own pics on Cloudinary to use here
    // picture credit: https://diverseui.com/
    let userPhotoNo = parseInt(user.phone.substring(user.phone.length - 2))
    if (userPhotoNo === 0) { userPhotoNo = 100 }
    user.picture.large = `https://res.cloudinary.com/dxdhkhw26/image/upload/c_fill,h_360,w_360,q_100/v1653223606/userphoto/${user.gender}-${userPhotoNo}.jpg`
    // nationality abbreviation used in emoji reference
    user.nat = user.nat.toLowerCase()
    // position data is converted from cell phone number
    user.position = positionListData[parseInt(user.cell.substring(user.cell.length - 2)) % 24]
  })
}

// render user list
function renderUsers(users) {
  userList.innerHTML = ""
  users.forEach((user) => {
    let color = favUsers.includes(user.login.salt) ? heartColor.red : heartColor.white
    userList.innerHTML += `<div class="card user-card mb-4 mx-2" style="max-width: 17.5rem;" id="${user.login.salt}">
        <div class="card-body position-absolute top-0 end-0 fav" style="z-index: 10;">
          <svg fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C12.2115 21 12.5136 20.8627 12.7351 20.7353C18.4048 17.2059 22 13.098 22 8.92157C22 5.45098 19.5529 3 16.3907 3C14.4899 3 13.0136 3.99212 12.0898 5.52285C12.0495 5.58964 11.9511 5.58931 11.9111 5.52229C11.0043 4.00067 9.50955 3 7.60927 3C4.44713 3 2 5.45098 2 8.92157C2 13.098 5.59517 17.2059 11.2749 20.7353C11.4864 20.8627 11.7885 21 12 21Z" style="fill: ${color}">
            </path>
          </svg>
        </div>
        <img src="${user.picture.large}"
          class="card-img-top" alt="...">
        <div class="card-body">
          <div class="card-title d-flex justify-content-between">
            <h5 style="width: fit-content">${user.name.first} ${user.name.last}</h5>
            <i class="em em-flag-${user.nat}" aria-role="presentation" aria-label="${user.location.country} Flag"></i>
          </div>
          <p class="card-subtitle">${user.position}</p>
          <a class="stretched-link" data-bs-toggle="modal" data-bs-target="#userInfoModal"></a>
        </div>
      </div>`
    // subtle white shadow
    let allCards = document.querySelectorAll(".user-card")
    allCards.forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        e.target.classList.toggle('shadow')
      })
      card.addEventListener('mouseleave', (e) => {
        e.target.classList.toggle('shadow')
      })
    })
  })
  // no favorites: error message
  if (users.length === 0) {
    userList.innerHTML = `<div class="w-100 d-flex flex-column align-items-center">
        <img src="https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif" width="360" height="202.5"/>
        <p class="py-4 mb-0 text-light">You have not saved any mentors, yet.</p>
        <a type="button" class="btn btn-primary bg-gradient btn-lg px-4" href="search.html">Get Started</a>
      </div>`
  }
}

// render modal
function renderModal(id) {
  const targetUser = users.filter(user => { return user.login.salt === id })[0]
  modalTitle.innerText = `About ${targetUser.name.first}`
  modalImg.src = targetUser.picture.large
  modalCard.innerHTML = `
                  <h5 class="card-title" id=${id}>${targetUser.name.first} ${targetUser.name.last} <i class="em em-flag-${targetUser.nat}" aria-role="presentation" aria-label="${targetUser.location.country} Flag"></i></h5>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0"><i
                        class="fa-solid fa-location-dot fa-fw pe-2"></i>${targetUser.location.city}, ${targetUser.location.country}</li>
                    <li class="list-group-item px-0"><i
                        class="fa-solid fa-briefcase fa-fw pe-2"></i>${targetUser.position}</li>
                    <li class="list-group-item px-0"><i
                        class="fa-solid fa-clock-two fa-fw pe-2"></i>${targetUser.location.timezone.description} (UTC${targetUser.location.timezone.offset})</li>
                  </ul>`
  contact.title = targetUser.email
  // refresh bootstrap built-in tooltip data
  let ttL = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  // toggle remove from favorite
  if (favUsers.includes(id)) {
    modalFav.innerText = "Unsave"
    modalFav.classList.remove("btn-secondary")
    modalFav.classList.add("btn-info")
  }
}

// convert img to JSON file
function toDataURL(url, callback, outputFormat){
    let img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        let canvas = document.createElement('CANVAS');
        let ctx = canvas.getContext('2d');
        let dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
        canvas = null; 
    };
    img.src = url;
}