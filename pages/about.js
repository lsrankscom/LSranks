export default function About(){
  async function submit(e){
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    alert("Thanks for your feedback!");
    e.currentTarget.reset();
  }
  return (
    <div className="container">
      <h2>Contact & feedback</h2>
      <form className="grid cols-2 card" onSubmit={submit}>
        <input className="input" name="email" placeholder="Your email" required/>
        <input className="input" name="topic" placeholder="Topic (optional)"/>
        <textarea className="input" name="message" placeholder="Message / suggestions" rows="6" required/>
        <button className="btn" type="submit">Send</button>
      </form>
    </div>
  );
}
