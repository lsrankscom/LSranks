export default function RequestCompetition(){
  async function submit(e){
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    await fetch("/api/requests/competition",{method:"POST",headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    alert("Thanks! We'll review your request.");
    e.currentTarget.reset();
  }
  return (
    <div className="container">
      <h2>Request competition</h2>
      <form className="grid cols-2 card" onSubmit={submit}>
        <input className="input" name="name" placeholder="Competition name" required />
        <input className="input" name="url" placeholder="Website / results URL" />
        <input className="input" name="city" placeholder="City" />
        <input className="input" name="date" placeholder="Date (YYYY-MM-DD)" />
        <textarea className="input" name="note" placeholder="Note (optional)" rows="4"></textarea>
        <button className="btn" type="submit">Send</button>
      </form>
    </div>
  );
}
