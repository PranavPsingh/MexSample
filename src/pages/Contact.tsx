import { useState } from 'react'

const EMAIL = 'hello@example.com' // TODO: replace with Mehak's real address

export default function Contact() {
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [msg, setMsg] = useState('')
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent('Hello from ' + (name || 'the website'))}&body=${encodeURIComponent(msg + '\n\n— ' + name + ' (' + from + ')')}`
  return (
    <main className="page contact">
      <div className="page-head">
        <p className="note">Say hello</p>
        <h1>Contact</h1>
        <p className="lede">Commissions, collaborations, orders, or just a note about the work.</p>
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          window.location.href = href
        }}
      >
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Your email
          <input type="email" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label>
          Message
          <textarea rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} required />
        </label>
        <button className="btn solid" type="submit">
          <span>Send</span>
        </button>
        <p className="muted small">Opens your email app for now. A real form backend comes in a later stage.</p>
      </form>
    </main>
  )
}
