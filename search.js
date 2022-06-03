//// DECLARATION ////
/// data source
if (!localStorage.getItem("seed")) { // set a static seed for each user so that every visit shows the same users
  localStorage.setItem("seed", Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5))
}
const seed = localStorage.getItem("seed")
const userURL = `https://randomuser.me/api/?results=200&seed=${seed}&noinfo`

/// querySelector
// bootstrap
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
// navbar
const settings = document.querySelector("#settings")
// filters
const filter = document.querySelector(".form-group")
const searchInput = document.querySelector("#searchform")
const filterSelector = [document.querySelector("#menuposition"), document.querySelector("#menucountry"), document.querySelector("#menutz")]
const positionFilter = document.querySelector("#menuposition")
const countryFilter = document.querySelector("#menucountry")
const tzFilter = document.querySelector("#menutz")
// user list
const usercount = document.querySelector("#usercount")
const userList = document.querySelector(".card-list")
const paginator = document.querySelector('#paginator')
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
let filters = {}
let favUsers = []
if (localStorage.getItem("favUsers")) {
  favUsers = JSON.parse(localStorage.getItem("favUsers"))
}
let filtering = false
let currentPage = 1
const usersPerPage = 24
const heartColor = { white: "#ffffff", red: "#F16D6D" }

//////// CODE START ////////

// get users
axios.get(userURL).then((res) => {
  const results = res.data.results
  results.forEach(result => users.push(result))
  // 1st render
  processUsers(users)
  filters = updateFilterList()
  renderFilter(filters.positions, "#menuposition")
  renderFilter(filters.countries, "#menucountry")
  renderFilter(filters.timezones, "#menutz", "UTC")
  renderUsers(getUsersByPage(currentPage))
  renderPaginator(users.length, currentPage)
}).catch(function(error) {
  console.log(error);
})

//// EVENT LISTENER ////
// settings
settings.addEventListener('click', (e) => {
  if (e.target.innerText === "Get New Users") {
    // reset seed and get a new batch of users
    localStorage.removeItem("seed")
    window.location.reload()
  } else if (e.target.innerText === "Reset Favorite") {
    localStorage.removeItem("favUsers")
    favUsers = []
    filterUsers = []
    currentPage = 1
    renderUsers(users)
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

// modal: toggle add to favorite
modalFav.addEventListener('click', (e) => {
  const t = e.target
  if (modalFav.innerText === "Save") {
    favUsers.push(t.closest(".modal-content").querySelector(".card-title").id)
    modalFav.innerText = "Unsave"
    modalFav.classList.remove("btn-secondary")
    modalFav.classList.add("btn-info")
  } else if (modalFav.innerText === "Unsave") {
    favUsers.splice(favUsers.findIndex(userId => userId === t.closest(".modal-content").querySelector(".card-title").id), 1)
    modalFav.innerText = "Save"
    modalFav.classList.remove("btn-info")
    modalFav.classList.add("btn-secondary")
  }
  localStorage.setItem('favUsers', JSON.stringify(favUsers))
  renderUsers(getUsersByPage(currentPage, filtering))
})

// filter by search
searchInput.addEventListener('keyup', (e) => {
  filtering = true
  applyFilters()
  if (searchInput.value === "") {
    filtering = false
  }
})

// filter by checkbox
filter.addEventListener('click', (e) => {
  const t = e.target
  // checkbox clear all
  if (t.classList.contains("clear")) {
    t.closest(".list-group").querySelectorAll('.select-option').forEach(child => child.checked = false)
    filtering = false
    applyFilters()
  }
  // filter
  if (t.classList.contains("select-option")) {
    filtering = true
    applyFilters()
  }
})

// paginator
paginator.addEventListener('click', (e) => {
  if (e.target.tagName !== 'A') return
  currentPage = Number(e.target.dataset.page)
  const currentUserList = filterUsers.length ? filterUsers : users
  renderUsers(getUsersByPage(currentPage, filtering))
  renderPaginator(currentUserList.length, currentPage)
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

// organize values from user list and update filter data
function updateFilterList() {
  let positions = Array.from(new Set(users.map(a => a.position))).sort()
  let countries = Array.from(new Set(users.map(a => a.location.country))).sort()
  // time zone was stored as a string ("-5:00"), so additional conditions were added here
  let timezones = Array.from(new Set(users.map(a => a.location.timezone.offset))).sort((a, b) => {
    let time1 = parseFloat(a.replace(':', '.'))
    let time2 = parseFloat(b.replace(':', '.'))
    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
  })
  return {positions: positions, countries: countries, timezones: timezones}
}

// render sorted filters according to data
function renderFilter(array, divSelector, prefix) {
  prefix = (prefix === undefined) ? "" : prefix
  let id = divSelector.substring(5)
  let selector = document.querySelector(divSelector)
  selector.innerHTML = ""
  selector.innerHTML += `<button type="submit" class="list-group-item list-group-item-action clear">Clear</button>`
  array.forEach((item) => {
    selector.innerHTML += `
      <label class="list-group-item">
          <input class="form-check-input select-option me-2" type="checkbox" filter="${id}" value="${item}">${prefix}${item}</label>`
  })
}

// apply filters
function applyFilters() {
  // handle search input filter
  let keyword = searchInput.value.trim().toLowerCase()
  if (keyword.length !== 0) {
    filterUsers = users.filter((user) => {
      const fullName = user.name.first + ' ' + user.name.last
      return fullName.toLowerCase().includes(keyword)
    })
  } else { filterUsers = users } // if no input, set to all users for later filter use
  // get a temporary filter that contains user selection
  let psFilter = []
  // for each filter, get the value that is checked
  filterSelector.forEach(sel => {
    let activefilter = Array.from(sel.querySelectorAll('.select-option')).filter(options => options.checked === true).map(option => option.value)
    psFilter.push(activefilter)
  })
  // users filter position -> fU (if no filter then skip)
  filterUsers = psFilter[0].length === 0 ? filterUsers : filterUsers.filter(user => psFilter[0].includes(user.position))
  // users filter country -> fU (if no filter then skip)
  filterUsers = psFilter[1].length === 0 ? filterUsers : filterUsers.filter(user => psFilter[1].includes(user.location.country))
  // users filter tz (if no filter then skip)
  filterUsers = psFilter[2].length === 0 ? filterUsers : filterUsers.filter(user => psFilter[2].includes(user.location.timezone.offset))
  // render all results
  currentPage = 1 // always show 1st page results
  renderUsers(getUsersByPage(currentPage, filtering))
  renderPaginator(filterUsers.length, currentPage)
}

// render user list
function renderUsers(users) {
  userList.innerHTML = ""
  users.forEach((user) => {
    let color = favUsers.includes(user.login.salt) ? heartColor.red : heartColor.white // check if user is saved
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
    let allCards = document.querySelectorAll(".user-card")
    // subtle white shadow
    allCards.forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        e.target.classList.toggle('shadow')
      })
      card.addEventListener('mouseleave', (e) => {
        e.target.classList.toggle('shadow')
      })
    })
  })
  // no search result: error message
  if (users.length === 0) {
    userList.innerHTML = `<div class="w-100 d-flex flex-column align-items-center">
        <img src="https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif" width="360" height="202.5"/>
        <p class="py-2 text-light">There are no users that matches your criteria.</p>
      </div>`
  }
}

// paginator director
function getUsersByPage(page, filtering = false) {
  const currentUserList = filtering ? filterUsers : users
  const startIndex = (page - 1) * usersPerPage
  return currentUserList.slice(startIndex, startIndex + usersPerPage)
}

// 5 page only render paginator
function renderPaginator(totalUsers, currentPage) {
  const numberOfPages = Math.ceil(totalUsers / usersPerPage)
  let rawHTML = ''
  if (totalUsers !== 0) {
    rawHTML += currentPage !== 1 ? `<li class="page-item">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
          </li>`: `<li class="page-item disabled">
            <a class="page-link" href="#">Previous</a>
          </li>`
    // if number of pages between 1~5, then only print 1 ~ number of pages, easy
    // number of pages larger than 5 : example
    // if number of pages is 7, then for each current page there could be
    // 1 ~ 5 (page 1), 2 ~ 6 (page 2), 3 ~ 7 (repeated for page 3~7)
    // so check if current page + 4 exceeds number of pages
    let startPage = numberOfPages > 5 ? (currentPage + 4 > numberOfPages ? numberOfPages - 4 : currentPage) : 1
    let endPage = numberOfPages > 5 ? (currentPage + 4 > numberOfPages ? numberOfPages : currentPage + 4) : numberOfPages
    for (let page = startPage; page <= endPage; page++) {
      let activeState = page === currentPage ? " active" : ""
      rawHTML += `<li class="page-item${activeState}"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
    }
    rawHTML += currentPage !== numberOfPages ? `<li class="page-item">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
          </li>`: `<li class="page-item disabled">
            <a class="page-link" href="#">Next</a>
          </li>`
  }
  paginator.innerHTML = rawHTML
  usercount.innerHTML = `${totalUsers} mentors found`
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
  // toggle save to favorite
  if (favUsers.includes(id)) {
    modalFav.innerText = "Unsave"
    modalFav.classList.remove("btn-secondary")
    modalFav.classList.add("btn-info")
  } else {
    modalFav.innerText = "Save"
    modalFav.classList.remove("btn-info")
    modalFav.classList.add("btn-secondary")
  }
}