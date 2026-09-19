  // apna emailjs public key yahan daal diya hai, isse real email jayega admin ko
  emailjs.init("VTDZyj_VJqH2rtJJh");

  // ----------- ye sara data ka kaam localStorage se ho raha hai (jaise database) -----------
  function getUsers() {
    let data = localStorage.getItem('jp_users');
    if (data == null) { return []; }
    return JSON.parse(data);
  }
  function saveUsers(userList) {
    localStorage.setItem('jp_users', JSON.stringify(userList));
  }

  function getJobs() {
    let data = localStorage.getItem('jp_jobs');
    if (data == null) { return []; }
    return JSON.parse(data);
  }
  function saveJobs(jobList) {
    localStorage.setItem('jp_jobs', JSON.stringify(jobList));
  }

  function getApplications() {
    let data = localStorage.getItem('jp_applications');
    if (data == null) { return []; }
    return JSON.parse(data);
  }
  function saveApplications(appList) {
    localStorage.setItem('jp_applications', JSON.stringify(appList));
  }

  function getNotifications() {
    let data = localStorage.getItem('jp_notifications');
    if (data == null) { return []; }
    return JSON.parse(data);
  }
  function saveNotifications(notifList) {
    localStorage.setItem('jp_notifications', JSON.stringify(notifList));
  }

  // current login session sessionStorage me rakha hai
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
  document.getElementById('signupBtn').addEventListener('click', function () {
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

    // note: same email se multiple baar signup allow kiya hai jaan bujh kar
    let users = getUsers();
    let newUser = { id: Date.now(), name: name, email: email, password: password, role: selectedRole };
    users.push(newUser);
    saveUsers(users);
    errorEl.style.display = 'none';

    setCurrentUser(newUser);
    enterApp();
  });

  // ----------- login ka kaam -----------
  document.getElementById('loginBtn').addEventListener('click', function () {
    let email = document.getElementById('loginEmail').value.trim().toLowerCase();
    let password = document.getElementById('loginPassword').value;
    let errorEl = document.getElementById('loginError');

    let users = getUsers();
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
  function enterApp() {
    let user = getCurrentUser();
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');

    let roleLabel = 'Job Seeker';
    if (user.role === 'admin') { roleLabel = 'Admin'; }
    document.getElementById('userBadge').textContent = user.name + ' (' + roleLabel + ')';

    if (user.role === 'admin') {
      document.getElementById('adminView').classList.remove('hidden');
      document.getElementById('userView').classList.add('hidden');
      renderAdminJobs();
    } else {
      document.getElementById('userView').classList.remove('hidden');
      document.getElementById('adminView').classList.add('hidden');
      renderUserJobs();
    }
    renderNotifications();
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

  manageTabBtn.addEventListener('click', function () {
    manageTabBtn.classList.add('active');
    postTabBtn.classList.remove('active');
    document.getElementById('manageTab').classList.remove('hidden');
    document.getElementById('postTab').classList.add('hidden');
    renderAdminJobs();
  });

  // ----------- naya job post karna -----------
  document.getElementById('postJobBtn').addEventListener('click', function () {
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

    let jobs = getJobs();
    let user = getCurrentUser();
    jobs.push({
      id: Date.now(),
      title: title,
      company: company,
      location: location,
      type: type,
      desc: desc,
      postedBy: user.id
    });
    saveJobs(jobs);

    // form ko clear kar diya post karne ke baad
    document.getElementById('jobTitle').value = '';
    document.getElementById('jobCompany').value = '';
    document.getElementById('jobLocation').value = '';
    document.getElementById('jobDesc').value = '';

    alert('Job posted successfully!');
    renderAdminJobs();
  });

  // ----------- admin ki list dikhana, applicants ke sath -----------
  function renderAdminJobs() {
    let list = document.getElementById('adminJobList');
    let jobs = getJobs();
    let applications = getApplications();
    let users = getUsers();

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
          '<button class="btn-sm btn-delete" onclick="deleteJob(' + job.id + ')">Delete</button>' +
        '</div>' +
        '<div class="applicants-list">' +
          '<strong style="font-size:12.5px;color:#555;">Applicants (' + applicants.length + '):</strong><br>' +
          applicantsHtml +
        '</div>';
      list.appendChild(div);
    }
  }

  // ----------- job delete karna -----------
  function deleteJob(jobId) {
    let jobs = getJobs();
    let remainingJobs = [];
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].id !== jobId) { remainingJobs.push(jobs[i]); }
    }
    saveJobs(remainingJobs);

    let applications = getApplications();
    let remainingApps = [];
    for (let j = 0; j < applications.length; j++) {
      if (applications[j].jobId !== jobId) { remainingApps.push(applications[j]); }
    }
    saveApplications(remainingApps);

    renderAdminJobs();
  }

  // ----------- user ko available jobs dikhana -----------
  function renderUserJobs() {
    let list = document.getElementById('jobListingsForUser');
    let jobs = getJobs();
    let user = getCurrentUser();
    let applications = getApplications();

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
      let btnHtml = 'onclick="applyToJob(' + job.id + ')"';
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
  function applyToJob(jobId) {
    let user = getCurrentUser();
    let jobs = getJobs();
    let job = null;
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].id === jobId) { job = jobs[i]; break; }
    }

    let applications = getApplications();
    applications.push({
      id: Date.now(),
      jobId: jobId,
      userId: user.id,
      applicantName: user.name,
      applicantEmail: user.email
    });
    saveApplications(applications);

    if (job != null) {
      // job post karne wale admin ke liye notification bana rahe hain
      let notifications = getNotifications();
      notifications.push({
        id: Date.now(),
        forUserId: job.postedBy,
        jobId: job.id,
        jobTitle: job.title,
        applicantName: user.name,
        applicantEmail: user.email,
        time: new Date().toLocaleString(),
        read: false
      });
      saveNotifications(notifications);

      // admin ka email nikal ke usko real email bhi bhej rahe hain (emailjs se)
      let allUsers = getUsers();
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

    renderUserJobs();
  }

  // ----------- notification bell wala part -----------
  function renderNotifications() {
    let user = getCurrentUser();
    if (user == null || user.role !== 'admin') {
      document.getElementById('notifWrap').classList.add('hidden');
      return;
    }
    document.getElementById('notifWrap').classList.remove('hidden');

    let allNotifs = getNotifications();
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
  document.getElementById('notifBell').addEventListener('click', function () {
    document.getElementById('notifPanel').classList.toggle('open');

    // panel khulte hi sab notification "read" mark kar diye
    let user = getCurrentUser();
    let notifications = getNotifications();
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].forUserId === user.id) {
        notifications[i].read = true;
      }
    }
    saveNotifications(notifications);
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
