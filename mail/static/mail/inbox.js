document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  let form = document.getElementById('compose-form');
  let sentUrl = '/emails/sent';

  form.addEventListener("submit", function(event) {
    // To help prevent the default form refresh characteristics
    event.preventDefault();

    let recipients = document.getElementById('compose-recipients').value;
    let subject = document.getElementById('compose-subject').value;
    let body = document.getElementById('compose-body').value;

    // fetch post
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
    });

    // load sentbox
    load_mailbox('sent');

    // Redirect to sentbox
    document.getElementById('submit-btn').onclick =
      function() {
        window.location.replace(sentUrl);
      }
  })


  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#all-emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  //Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

// using get request to retrieve details
fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {

      let outputMail = document.createElement("div");

      // choosing mailbox users details
      let mailboxUser = (mailbox != "sent") ? `${email.sender}` : `${email.recipients}`;

      outputMail.innerHTML = `
        <div class="col-6 col-sm-7 col-md-4 p-2 text-truncate">${mailboxUser}</div>
        <div class="col-6 col-sm-5 col-md-3 p-2 order-md-2 small text-right text-muted font-italic font-weight-lighter align-self-center">${email.timestamp}</div>
        <div class="col px-2 pb-2 pt-md-2 order-md-1 text-truncate">${email.subject}</div>
      `;
      outputMail.className = 'row justify-content-between border border-left-0 border-right-0 border-bottom-0 pointer-link p-2';

      // adding read or unread background colour
      if (mailbox === "inbox" && email.read == true) {
        outputMail.style.backgroundColor = '#f1f2f3';
      } 
      // Makes unread emails bold
      if (mailbox === "inbox" && email.read == false) {
        outputMail.classList.add('font-weight-bold');
      }

      document.querySelector('#emails-view').appendChild(outputMail);

      // show the content of the mailbox
      outputMail.addEventListener('click', function(){
        viewEmail(email.id, mailbox)
      });

    })  

  });
}


// user should be able to view each email
function viewEmail(id, mailbox) {

    // Show content view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'block';
  document.querySelector('#content-view').innerHTML = "";

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    let showContent = document.createElement("div");
      // Print content of the email
      showContent.innerHTML = `
        <div class="d-flex justify-content-between flex-nowrap-sm flex-wrap">
          <h5 class="text-wrap">${email.subject}</h5>
          <small class="mr-lg-4 ml-0 ml-sm-2 font-weight-lighter align-self-center text-muted text-right"><em>${email.timestamp}</em></small>
        </div>
        <div class="d-flex justify-content-between py-3 pt-md-2 border-bottom flex-wrap">
          <div>
            <strong>From:</strong> ${email.sender}<br>
            <strong>To:</strong> ${email.recipients}<br>
          </div>
          <div class="text-nowrap mr-lg-4 ml-0 ml-sm-2" id="buttons">
          </div>
        </div>
        <div class="pt-1" style="white-space: pre-line">
          ${email.body}
        </div>
        `
      document.querySelector('#content-view').appendChild(showContent);

      // add reply and archive button
      let buttonsDiv = document.getElementById("buttons");

      // add reply button
      let replyBtn = document.createElement("replyDiv");
      replyBtn.innerHTML = `<div onclick="addReply(${id})"><i class="fa fa-reply" aria-hidden="true"></i></div>`;
      buttonsDiv.appendChild(replyBtn);

      // only show this archive icon in inbox and archive
      if (mailbox != 'sent'){
        //   add the archive button
        let archiveBtn = document.createElement("archiveDiv");
        archiveBtn.innerHTML = `<div onclick="archiveEmail(${email.id}, '${mailbox}', ${email.archived})"><i class="fa fa-archive" aria-hidden="true"></i></div>`;

        buttonsDiv.appendChild(archiveBtn);
      }

  // Using PUT, change the read email boolean value to true
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  });
}


function archiveEmail(id, mailbox, isArchived) {
  if (mailbox == 'archive' && isArchived==true){
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
  }
  else {
    fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  }
  
    // reload the inbox
  load_mailbox('inbox');
}


function addReply(id){
    // Show the compost-form for user to edit and hide other views
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#content-view').style.display = 'none';

    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.getElementById('compose-sender').value = email.recipients;

      document.getElementById('compose-recipients').value = email.sender;

      if (document.getElementById('compose-subject').value.startsWith("Re")) {
        document.getElementById('compose-subject').value = email.subject;
        } else {
        document.getElementById('compose-subject').value = "Re: " + email.subject;
              }

      document.getElementById('compose-body').value = `\n >>>On ${email.timestamp} ${email.sender} wrote: \n` + email.body ;

    })
}