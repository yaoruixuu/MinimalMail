document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email(repRecipient="", title="", replyBody="") {
  
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  if (repRecipient !== "" && title !== "" && replyBody !== ""){
    let recipients = repRecipient;
    let subject = title;
    let body = replyBody;
    document.querySelector('#compose-recipients').value=recipients;
    document.querySelector('#compose-subject').value=subject;
    document.querySelector('#compose-body').value = body;
  }

  else{
    // Clear out composition fields
    
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
    

  document.querySelector('#compose-form').onsubmit = function(){
    
    //get form values
    let emailRecipients = document.querySelector('#compose-recipients').value;
    let emailSubject = document.querySelector('#compose-subject').value;
    let emailBody = editorInstance.getData();
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: emailRecipients,
        subject: emailSubject,
        body: emailBody
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.message == "Email sent successfully."){
        load_mailbox('sent');
        
      }
      else{
        alert(result.error);
      }
    })
    return false;
  }
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  //get mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails =>{

    console.log(emails)
    if (emails.length ==0){
      no_mail = document.createElement('h1')
      no_mail.innerHTML = "no mail."
      img = document.createElement("img");
      img.id='no-mail'
      img.src='https://media.tenor.com/Qg-uyvmj8L8AAAAM/mailbox-charlie-brown.gif';
      document.querySelector('#emails-view').append(no_mail);
      document.querySelector('#emails-view').append(img);
    }

    emails.forEach((email)=>{
      
      //create html elements
      const div = document.createElement('div');
      const sender = document.createElement('div');
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');

      sender.innerHTML = `From: ${email.sender}`;
      subject.innerHTML = `Subject: ${email.subject}`;
      timestamp.innerHTML = `Time: ${email.timestamp}`;

      div.id="email";

      // load email when clicked
      div.addEventListener('click', function(){
        load_email(email.id, mailbox);
      })

      div.append(sender);
      div.append(subject);
      div.append(timestamp);

      if (email.read === true && mailbox!=='sent'){
        div.style.backgroundColor = "gray";
      }
      
      
      document.querySelector('#emails-view').append(div)
      
      
    })
  }) 
  }

  function load_email(email_id, mailbox){
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    //marking as read
    fetch(`/emails/${email_id}`,{
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })


    // displaying email
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email =>{
      const div = document.createElement('div');
      const sender = document.createElement('div');
      const recipients = document.createElement('div');
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');
      const button = document.createElement('button');
      const reply = document.createElement('button');
      const body = document.createElement('pre');
      const del = document.createElement('button');

      sender.innerHTML = `<strong>Sent By:</strong> ${email.sender}`;
      recipients.innerHTML = `<strong>Recieved By:</strong> ${email.recipients}`;
      subject.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
      timestamp.innerHTML = `<strong>Delivered At:</strong> ${email.timestamp}`;
      reply.innerHTML = 'Reply';
      del.innerHTML = 'Delete';

      // delete button
      del.onclick = function(){
        fetch(`emails/${email_id}`,
          {
            method: 'DELETE'
          }
        )
          .then(()=>{
            load_mailbox('inbox');
          }
        )
      }



      //archive button
      //check if archived
      archived="Archive";
      if (email.archived){
        archived="Unarchive"
      }
      button.innerHTML = `${archived}`;
      
      
      // archive/unarchive
      button.onclick = function(){
        fetch(`/emails/${email_id}`,{
          method:'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        }
        )
        .then(()=>{
        load_mailbox('inbox');
        }
        ) 
      }

      //reply button
      reply.onclick = function(){
        const recipient = email.sender;
        const subject = `RE: ${email.subject}`;
        const body = `On ${email.timestamp} ${recipient} wrote:\n${email.body}`;

        compose_email(recipient, subject, body);
      }


      body.innerHTML = email.body;
      body.id = 'body'
      div.append(reply);
      if (mailbox !== 'sent'){
        div.append(button);
      }
      div.append(del);
      div.append(sender);
      div.append(recipients);
      div.append(subject);
      div.append(timestamp);
      div.append(body);

      
      
      

      //clear then add div
      document.querySelector('#email-view').innerHTML='';
      document.querySelector('#email-view').append(div);
    })
  }
