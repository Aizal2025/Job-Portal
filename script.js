 // apna emailjs public key yahan daal diya hai, isse real email jayega admin ko
emailjs.init("VTDZyj_VJqH2rtJJh");

// ----------- Firebase setup (LocalStorage ki jagah ab yahi database ka kaam karega) -----------
let firebaseConfig = {
  apiKey: "AIzaSyB2nz7WIbS45cTuOwPfqB0Dr_3JIVcoIl8",
  authDomain: "job-portal-9b62e.firebaseapp.com",
  projectId: "job-portal-9b62e",
  storageBucket: "job-portal-9b62e.firebasestorage.app",
  messagingSenderId: "898786258402",
  appId: "1:898786258402:web:d49a4d86fdcd226e19ddbb"
};

firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

// ----------- Data helpers ab Firestore se baat karte hain, LocalStorage se nahi -----------

async function getUsers() {
  let snapshot = await db.collection('users').get();
  let users = [];
  snapshot.forEach(function (doc) {
    let data = doc.data();
    data.id = doc.id;
    users.push(data);
  });
  return users;
}

async function addUserToDb(userObj) {
  let docRef = await db.collection('users').add(userObj);
  userObj.id = docRef.id;
  return userObj;
}

async function getJobs() {
  let snapshot = await db.collection('jobs').get();
  let jobs = [];
  snapshot.forEach(function (doc) {
    let data = doc.data();
    data.id = doc.id;
    jobs.push(data);
  });
  return jobs;
}

async function addJobToDb(jobObj) {
  let docRef = await db.collection('jobs').add(jobObj);
  jobObj.id = docRef.id;
  return jobObj;
}

async function updateJobInDb(jobId, updatedFields) {
  await db.collection('jobs').doc(jobId).update(updatedFields);
}

async function deleteJobFromDb(jobId) {
  await db.collection('jobs').doc(jobId).delete();
}

async function getApplications() {
  let snapshot = await db.collection('applications').get();
  let applications = [];
  snapshot.forEach(function (doc) {
    let data = doc.data();
    data.id = doc.id;
    applications.push(data);
  });
  return applications;
}

async function addApplicationToDb(appObj) {
  await db.collection('applications').add(appObj);
}

async function deleteApplicationsForJob(jobId) {
  let snapshot = await db.collection('applications').where('jobId', '==', jobId).get();
  let jobsToDelete = [];
  snapshot.forEach(function (doc) {
    jobsToDelete.push(doc.ref.delete());
  });
  await Promise.all(jobsToDelete);
}

async function getNotifications() {
  let snapshot = await db.collection('notifications').get();
  let notifications = [];
  snapshot.forEach(function (doc) {
    let data = doc.data();
    data.id = doc.id;
    notifications.push(data);
  });
  return notifications;
}

async function addNotificationToDb(notifObj) {
  await db.collection('notifications').add(notifObj);
}

async function markMyNotificationsRead(userId) {
  let snapshot = await db.collection('notifications').where('forUserId', '==', userId).get();
  let updates = [];
  snapshot.forEach(function (doc) {
    updates.push(doc.ref.update({ read: true }));
  });
  await Promise.all(updates);
}

// current login session ab bhi sessionStorage me hi rakha hai
// (ye sirf "is device pe abhi kaun login hai" batata hai, isse data share nahi hota)
function getCurrentUser() {
  let data = sessionStorage.getItem('jp_current_user');
  if (data == null) { return null; }
  return JSON.parse(data);
}
function setCurrentUser(userObj) {
  sessionStorage.setItem('jp_current_user', JSON.stringify(userObj));
}
function clearCurrentUser() {
  sessionStorage.removeItem('jp_current_user');
}

// ----------- tab switch (login/signup) -----------
let loginTabBtn = document.getElementById('loginTabBtn');
let signupTabBtn = document.getElementById('signupTabBtn');
let loginForm = document.getElementById('loginForm');
let signupForm = document.getElementById('signupForm');

loginTabBtn.addEventListener('click', function () {
  loginTabBtn.classList.add('active');
  signupTabBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
});

signupTabBtn.addEventListener('click', function () {
  signupTabBtn.classList.add('active');
  loginTabBtn.classList.remove('active');
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// role select karne wala part (job seeker ya admin)
let selectedRole = 'user';
let roleOptions = document.querySelectorAll('.role-option');
for (let r = 0; r < roleOptions.length; r++) {
  roleOptions[r].addEventListener('click', function () {
    for (let k = 0; k < roleOptions.length; k++) {
      roleOptions[k].classList.remove('selected');
    }
    this.classList.add('selected');
    selectedRole = this.dataset.role;
  });
}

// ----------- signup ka kaam -----------
document.getElementById('signupBtn').addEventListener('click', async function () {
  let name = document.getElementById('signupName').value.trim();
  let email = document.getElementById('signupEmail').value.trim().toLowerCase();
  let password = document.getElementById('signupPassword').value;
  let errorEl = document.getElementById('signupError');

  // basic check ki koi field khali na ho
  if (!name || !email || !password) {
    errorEl.textContent = "Please fill all fields.";
    errorEl.style.display = 'block';
    return;
  }

  errorEl.style.display = 'none';

  // note: same email se multiple baar signup allow kiya hai jaan bujh kar
  let newUser = { name: name, email: email, password: password, role: selectedRole };
  newUser = await addUserToDb(newUser);

  setCurrentUser(newUser);
  enterApp();
});

// ----------- login ka kaam -----------
document.getElementById('loginBtn').addEventListener('click', async function () {
  let email = document.getElementById('loginEmail').value.trim().toLowerCase();
  let password = document.getElementById('loginPassword').value;
  let errorEl = document.getElementById('loginError');

  let users = await getUsers();
  let matchedUser = null;
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].password === password) {
      matchedUser = users[i];
      break;
    }
  }

  if (matchedUser == null) {
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';
  setCurrentUser(matchedUser);
  enterApp();
});

// ----------- logout -----------
document.getElementById('logoutBtn').addEventListener('click', function () {
  clearCurrentUser();
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
});

// ----------- login/signup ke baad sahi wala screen dikhana -----------
async function enterApp() {
  let user = getCurrentUser();
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');

  let roleLabel = 'Job Seeker';
  if (user.role === 'admin') { roleLabel = 'Admin'; }
  document.getElementById('userBadge').textContent = user.name + ' (' + roleLabel + ')';

  if (user.role === 'admin') {
    document.getElementById('adminView').classList.remove('hidden');
    document.getElementById('userView').classList.add('hidden');
    await renderAdminJobs();
  } else {
    document.getElementById('userView').classList.remove('hidden');
    document.getElementById('adminView').classList.add('hidden');
    await renderUserJobs();
  }
  await renderNotifications();
}

// ----------- admin ke andar do tabs hain: post job aur manage job -----------
let postTabBtn = document.getElementById('postTabBtn');
let manageTabBtn = document.getElementById('manageTabBtn');

postTabBtn.addEventListener('click', function () {
  postTabBtn.classList.add('active');
  manageTabBtn.classList.remove('active');
  document.getElementById('postTab').classList.remove('hidden');
  document.getElementById('manageTab').classList.add('hidden');
});

manageTabBtn.addEventListener('click', async function () {
  manageTabBtn.classList.add('active');
  postTabBtn.classList.remove('active');
  document.getElementById('manageTab').classList.remove('hidden');
  document.getElementById('postTab').classList.add('hidden');
  await renderAdminJobs();
});

// ----------- naya job post karna -----------
document.getElementById('postJobBtn').addEventListener('click', async function () {
  let title = document.getElementById('jobTitle').value.trim();
  let company = document.getElementById('jobCompany').value.trim();
  let location = document.getElementById('jobLocation').value.trim();
  let type = document.getElementById('jobType').value;
  let desc = document.getElementById('jobDesc').value.trim();
  let errorEl = document.getElementById('jobError');

  if (!title || !company || !location || !desc) {
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  let user = getCurrentUser();
  let newJob = {
    title: title,
    company: company,
    location: location,
    type: type,
    desc: desc,
    postedBy: user.id
  };
  await addJobToDb(newJob);

  // form ko clear kar diya post karne ke baad
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobCompany').value = '';
  document.getElementById('jobLocation').value = '';
  document.getElementById('jobDesc').value = '';

  alert('Job posted successfully!');
  await renderAdminJobs();
});

// ----------- admin ki list dikhana, applicants ke sath -----------
async function renderAdminJobs() {
  let list = document.getElementById('adminJobList');
  list.innerHTML = '<p class="empty-note">Loading jobs...</p>';

  let jobs = await getJobs();
  let applications = await getApplications();
  let users = await getUsers();

  if (jobs.length === 0) {
    list.innerHTML = '<p class="empty-note">No jobs posted yet. Use the "Post a Job" tab to add one.</p>';
    return;
  }

  list.innerHTML = '';

  for (let i = 0; i < jobs.length; i++) {
    let job = jobs[i];

    // is job pe kisne kisne apply kiya, wo dhoondh rahe hain
    let applicants = [];
    for (let j = 0; j < applications.length; j++) {
      if (applications[j].jobId === job.id) {
        for (let k = 0; k < users.length; k++) {
          if (users[k].id === applications[j].userId) {
            applicants.push(users[k]);
          }
        }
      }
    }

    let applicantsHtml = '<span style="font-size:12.5px;color:#aaa;">No applications yet</span>';
    if (applicants.length > 0) {
      applicantsHtml = '';
      for (let a = 0; a < applicants.length; a++) {
        applicantsHtml += '<span class="applicant-chip">' + escapeHtml(applicants[a].name) + ' (' + escapeHtml(applicants[a].email) + ')</span>';
      }
    }

    let div = document.createElement('div');
    div.className = 'card job-card';
    div.innerHTML =
      '<h3>' + escapeHtml(job.title) + '</h3>' +
      '<div class="meta">' + escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location) + ' &middot; ' + escapeHtml(job.type) + '</div>' +
      '<div class="desc">' + escapeHtml(job.desc) + '</div>' +
      '<div class="job-actions">' +
        '<button class="btn-sm btn-edit" onclick="editJob(\'' + job.id + '\')">Edit</button>' +
        '<button class="btn-sm btn-delete" onclick="deleteJob(\'' + job.id + '\')">Delete</button>' +
      '</div>' +
      '<div class="applicants-list">' +
        '<strong style="font-size:12.5px;color:#555;">Applicants (' + applicants.length + '):</strong><br>' +
        applicantsHtml +
      '</div>';
    list.appendChild(div);
  }
}

// ----------- job edit karna -----------
async function editJob(jobId) {
  let jobs = await getJobs();
  let job = null;
  for (let i = 0; i < jobs.length; i++) {
    if (jobs[i].id === jobId) { job = jobs[i]; break; }
  }
  if (job == null) { return; }

  let newTitle = prompt("Edit Job Title:", job.title);
  if (newTitle == null || newTitle.trim() === '') { return; }

  let newCompany = prompt("Edit Company Name:", job.company);
  if (newCompany == null || newCompany.trim() === '') { return; }

  let newLocation = prompt("Edit Location:", job.location);
  if (newLocation == null || newLocation.trim() === '') { return; }

  let newDesc = prompt("Edit Job Description:", job.desc);
  if (newDesc == null || newDesc.trim() === '') { return; }

  await updateJobInDb(jobId, {
    title: newTitle.trim(),
    company: newCompany.trim(),
    location: newLocation.trim(),
    desc: newDesc.trim()
  });

  await renderAdminJobs();
}

// ----------- job delete karna -----------
async function deleteJob(jobId) {
  await deleteJobFromDb(jobId);
  await deleteApplicationsForJob(jobId);
  await renderAdminJobs();
}

// ----------- user ko available jobs dikhana -----------
async function renderUserJobs() {
  let list = document.getElementById('jobListingsForUser');
  list.innerHTML = '<div class="card"><p class="empty-note">Loading jobs...</p></div>';

  let jobs = await getJobs();
  let user = getCurrentUser();
  let applications = await getApplications();

  if (jobs.length === 0) {
    list.innerHTML = '<div class="card"><p class="empty-note">No jobs available right now. Please check back later.</p></div>';
    return;
  }

  list.innerHTML = '';

  for (let i = 0; i < jobs.length; i++) {
    let job = jobs[i];

    // check kar rahe hain ki is job pe pehle se apply kiya hai ya nahi
    let alreadyApplied = false;
    for (let j = 0; j < applications.length; j++) {
      if (applications[j].jobId === job.id && applications[j].userId === user.id) {
        alreadyApplied = true;
        break;
      }
    }

    let btnClass = 'btn-apply';
    let btnHtml = 'onclick="applyToJob(\'' + job.id + '\')"';
    let btnText = 'Apply Now';
    if (alreadyApplied) {
      btnClass = 'btn-applied';
      btnHtml = 'disabled';
      btnText = 'Applied ✓';
    }

    let div = document.createElement('div');
    div.className = 'card job-card';
    div.innerHTML =
      '<h3>' + escapeHtml(job.title) + '</h3>' +
      '<div class="meta">' + escapeHtml(job.company) + ' &middot; ' + escapeHtml(job.location) + ' &middot; ' + escapeHtml(job.type) + '</div>' +
      '<div class="desc">' + escapeHtml(job.desc) + '</div>' +
      '<div class="job-actions">' +
        '<button class="btn-sm ' + btnClass + '" ' + btnHtml + '>' + btnText + '</button>' +
      '</div>';
    list.appendChild(div);
  }
}

// ----------- job pe apply karna -----------
async function applyToJob(jobId) {
  let user = getCurrentUser();
  let jobs = await getJobs();
  let job = null;
  for (let i = 0; i < jobs.length; i++) {
    if (jobs[i].id === jobId) { job = jobs[i]; break; }
  }

  await addApplicationToDb({
    jobId: jobId,
    userId: user.id,
    applicantName: user.name,
    applicantEmail: user.email
  });

  if (job != null) {
    // job post karne wale admin ke liye notification bana rahe hain
    await addNotificationToDb({
      forUserId: job.postedBy,
      jobId: job.id,
      jobTitle: job.title,
      applicantName: user.name,
      applicantEmail: user.email,
      time: new Date().toLocaleString(),
      read: false
    });

    // admin ka email nikal ke usko real email bhi bhej rahe hain (emailjs se)
    let allUsers = await getUsers();
    let admin = null;
    for (let k = 0; k < allUsers.length; k++) {
      if (allUsers[k].id === job.postedBy) { admin = allUsers[k]; break; }
    }

    if (admin != null) {
      emailjs.send("service_nyzb2qd", "template_jt2jxaf", {
        to_email: admin.email,
        applicant_name: user.name,
        applicant_email: user.email,
        job_title: job.title
      }).catch(function (err) {
        console.log("Email nahi ja paya:", err);
      });
    }
  }

  await renderUserJobs();
}

// ----------- notification bell wala part -----------
async function renderNotifications() {
  let user = getCurrentUser();
  if (user == null || user.role !== 'admin') {
    document.getElementById('notifWrap').classList.add('hidden');
    return;
  }
  document.getElementById('notifWrap').classList.remove('hidden');

  let allNotifs = await getNotifications();
  let myNotifs = [];
  for (let i = 0; i < allNotifs.length; i++) {
    if (allNotifs[i].forUserId === user.id) { myNotifs.push(allNotifs[i]); }
  }
  myNotifs.reverse(); // latest sabse upar dikhe isliye

  let unreadCount = 0;
  for (let j = 0; j < myNotifs.length; j++) {
    if (!myNotifs[j].read) { unreadCount++; }
  }

  let badge = document.getElementById('notifBadge');
  badge.textContent = unreadCount;
  if (unreadCount > 0) {
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }

  let list = document.getElementById('notifList');
  if (myNotifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">No applications yet.</div>';
    return;
  }

  let listHtml = '';
  for (let k = 0; k < myNotifs.length; k++) {
    let n = myNotifs[k];
    listHtml +=
      '<div class="notif-item">' +
        '<b>' + escapeHtml(n.applicantName) + '</b> (' + escapeHtml(n.applicantEmail) + ') applied for <b>' + escapeHtml(n.jobTitle) + '</b>' +
        '<span class="notif-time">' + escapeHtml(n.time) + '</span>' +
      '</div>';
  }
  list.innerHTML = listHtml;
}

// bell pe click karne se panel khulta/band hota hai
document.getElementById('notifBell').addEventListener('click', async function () {
  document.getElementById('notifPanel').classList.toggle('open');

  // panel khulte hi sab notification "read" mark kar diye
  let user = getCurrentUser();
  await markMyNotificationsRead(user.id);
  setTimeout(renderNotifications, 300);
});

// panel ke bahar click karo to wo band ho jaye
document.addEventListener('click', function (e) {
  let wrap = document.getElementById('notifWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('notifPanel').classList.remove('open');
  }
});

// security ke liye, user ka text safe kar dete hain HTML me daalne se pehle
function escapeHtml(text) {
  let div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// agar pehle se login session hai to seedha app khol do
window.addEventListener('load', function () {
  let user = getCurrentUser();
  if (user) { enterApp(); }
});
