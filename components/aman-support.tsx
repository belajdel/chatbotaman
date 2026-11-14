'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, ChevronDown, Clock3, HeartHandshake, LockKeyhole, MessageCircle, ShieldCheck, Sparkles, X } from 'lucide-react'

type Locale = 'ar' | 'fr'
type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string; handoff?: boolean }

const copy = {
  ar: {
    title: 'أمان', subtitle: 'السلامة الرقمية والدعم القانوني', exit: 'خروج سريع',
    welcome: 'أنتِ لستِ وحدك. نحن هنا لنستمع إليكِ ونساعدكِ، دون حكم.',
    privacy: 'محادثتكِ خاصة ولا تُحفظ على خوادم عامة.',
    starters: ['كيفاش نحمي روحي من الابتزاز الإلكتروني؟', 'شنوة يقول القانون التونسي (قانون 58)؟', 'نحب نحكي مع مختص / فريق الدعم'],
    prompt: 'اكتبي رسالتك هنا…', request: 'طلب مساعدة شخصية', send: 'إرسال', support: 'أنا هنا للاستماع. شاركيني ما تشعرين بالراحة في مشاركته.',
    offline: 'تعذّر الاتصال الآن. لا بأس—يمكنكِ المحاولة مجددًا أو طلب مساعدة شخصية من الفريق.', typing: 'أمان تكتب…', help: 'طلب مساعدة شخصية',
    method: 'طريقة التواصل المفضلة', handle: 'وسيلة تواصل آمنة أو رقم الهاتف', urgency: 'مستوى الاستعجال', message: 'كيف يمكن لفريقنا مساعدتك؟',
    low: 'منخفض', medium: 'متوسط', high: 'عالٍ', submit: 'إرسال الطلب بأمان', cancel: 'إلغاء', telegram: 'تيليغرام', whatsapp: 'واتساب', phone: 'مكالمة هاتفية', signal: 'سيغنال',
    sentTitle: 'تم استلام رسالتك', sentBody: 'وصلت رسالتك إلى فريق الدعم عبر تيليغرام. سيتواصل معكِ الفريق بأمان وبالطريقة التي اخترتِها.', done: 'تم', handoff: 'قد يكون التواصل مع شخص مختص مفيدًا. يمكنكِ طلب مساعدة شخصية في أي وقت.',
    assistant: 'فريق أمان', yours: 'أنتِ', close: 'إغلاق', confidentiality: 'خصوصيتكِ تهمنا', intro: 'مساحة آمنة للدعم والمعلومات', more: 'نحن نستمع إليكِ، على راحتك.'
  },
  fr: {
    title: 'Aman', subtitle: 'Sécurité numérique & soutien juridique', exit: 'Sortie rapide',
    welcome: 'Vous n’êtes pas seule. Nous sommes là pour vous écouter et vous accompagner, sans jugement.',
    privacy: 'Votre conversation est privée et n’est pas enregistrée sur des serveurs publics.',
    starters: ['Comment me protéger du chantage en ligne ?', 'Que dit la loi tunisienne 58 ?', 'Je souhaite parler à une spécialiste / l’équipe'],
    prompt: 'Écrivez votre message…', request: 'Demander une aide personnelle', send: 'Envoyer', support: 'Je suis là pour vous écouter. Partagez uniquement ce que vous souhaitez.',
    offline: 'Connexion indisponible pour le moment. Vous pouvez réessayer ou demander une aide personnelle à notre équipe.', typing: 'Aman écrit…', help: 'Demander une aide personnelle',
    method: 'Méthode de contact préférée', handle: 'Coordonnée sûre ou numéro de téléphone', urgency: 'Niveau d’urgence', message: 'Comment notre équipe peut-elle vous aider ?',
    low: 'Faible', medium: 'Moyen', high: 'Élevé', submit: 'Envoyer la demande en sécurité', cancel: 'Annuler', telegram: 'Telegram', whatsapp: 'WhatsApp', phone: 'Appel téléphonique', signal: 'Signal',
    sentTitle: 'Votre message a été reçu', sentBody: 'Votre message a été transmis à notre équipe de soutien sur Telegram. Elle vous contactera en toute sécurité selon votre préférence.', done: 'Terminé', handoff: 'Parler à une spécialiste peut être utile. Vous pouvez demander une aide personnelle à tout moment.',
    assistant: 'Équipe Aman', yours: 'Vous', close: 'Fermer', confidentiality: 'Votre confidentialité compte', intro: 'Un espace sûr pour du soutien et des informations', more: 'Nous sommes à votre écoute, à votre rythme.'
  },
}

function renderMessage(text: string) {
  return text.split('\n').map((line, i) => <p key={i} className={i ? 'mt-2' : ''}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}</p>)
}

export function AmanSupport() {
  const [locale, setLocale] = useState<Locale>('ar')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contactMethod, setContactMethod] = useState('Telegram')
  const [contact, setContact] = useState('')
  const [urgency, setUrgency] = useState('medium')
  const [helpMessage, setHelpMessage] = useState('')
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const lastEscape = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  const t = copy[locale]
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  const quickExit = useCallback(() => {
    setMessages([])
    setDraft('')
    window.location.replace('https://www.google.com')
  }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const now = Date.now()
      if (now - lastEscape.current < 900) quickExit()
      lastEscape.current = now
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [quickExit])

  const openHelp = (prefill = '') => { setHelpMessage(prefill); setSubmitted(false); setFormError(''); setModal(true) }

  async function sendMessage(value = draft) {
    const content = value.trim()
    if (!content || busy) return
    const userMessage: ChatMessage = { role: 'user', content, id: crypto.randomUUID() }
    const next = [...messages, userMessage]
    setMessages(next)
    setDraft('')
    setBusy(true)
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      })
      if (!response.ok) throw new Error('Chat service unavailable')
      const data = await response.json()
      const reply = typeof data.reply === 'string' ? data.reply : typeof data.message === 'string' ? data.message : typeof data.response === 'string' ? data.response : t.support
      const handoff = data.suggest_handoff === true
      setMessages(current => [...current, { role: 'assistant', content: reply, id: crypto.randomUUID(), handoff }])
      if (handoff) openHelp(content)
    } catch {
      setMessages(current => [...current, { role: 'assistant', content: t.offline, id: crypto.randomUUID() }])
    } finally { setBusy(false) }
  }

  async function submitHelp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setFormBusy(true)
    try {
      const response = await fetch('http://localhost:8000/api/escalate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_method: contactMethod, contact, urgency, message: helpMessage }),
      })
      if (!response.ok) throw new Error('Request failed')
      setSubmitted(true)
    } catch {
      setFormError(locale === 'ar' ? 'تعذّر إرسال الطلب الآن. تحققي من الاتصال وحاولي مجددًا.' : 'La demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.')
    } finally { setFormBusy(false) }
  }

  return (
    <main dir={dir} className="aman-shell" lang={locale}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Aman home"><span className="brand-mark"><ShieldCheck size={22} /></span><span><b>{t.title} <span className="arabic-brand">/ أمان</span></b><small>{t.subtitle}</small></span></a>
        <div className="top-actions">
          <button className="language-button" onClick={() => setLocale(locale === 'ar' ? 'fr' : 'ar')} aria-label={locale === 'ar' ? 'Français' : 'العربية'}><span>العربية</span><span className="language-divider">/</span><span>Français</span><ChevronDown size={14} /></button>
          <button className="exit-button" onClick={quickExit}><X size={15} /><span>{t.exit}</span></button>
        </div>
      </header>

      <section className="main-area" id="home">
        <div className="intro-block"><div className="eyebrow"><span className="eyebrow-dot" />{t.intro}</div><h1>{t.welcome}</h1><p className="intro-subtitle">{t.more}</p></div>
        <section className="chat-card" aria-label={locale === 'ar' ? 'محادثة أمان' : 'Conversation Aman'}>
          <div className="privacy-strip"><span className="privacy-icon"><LockKeyhole size={15} /></span><span>{t.privacy}</span><span className="private-pill"><span />{t.confidentiality}</span></div>
          <div className={`conversation ${messages.length ? 'has-messages' : ''}`} aria-live="polite">
            {messages.length === 0 ? <div className="empty-state"><div className="empty-icon"><HeartHandshake size={27} /></div><div className="empty-copy"><span className="assistant-name">{t.assistant}</span><p>{t.support}</p></div><div className="starter-area"><span className="starter-label"><Sparkles size={14} />{locale === 'ar' ? 'يمكنكِ البدء بسؤال' : 'Vous pouvez commencer par'}</span><div className="starter-list">{t.starters.map((starter, i) => <button className="starter-chip" key={starter} onClick={() => i === 2 ? openHelp(starter) : sendMessage(starter)}>{starter}<span aria-hidden="true">{dir === 'rtl' ? '←' : '→'}</span></button>)}</div></div></div> : <div className="message-list">{messages.map(message => <article className={`message-row ${message.role}`} key={message.id}><span className="message-avatar">{message.role === 'assistant' ? <ShieldCheck size={16} /> : <MessageCircle size={16} />}</span><div className="message-body"><span className="message-author">{message.role === 'assistant' ? t.assistant : t.yours}</span><div className="bubble">{renderMessage(message.content)}</div>{message.handoff && <div className="handoff-note"><HeartHandshake size={16} /><span>{t.handoff}</span><button onClick={() => openHelp()}> {t.help}</button></div>}</div></article>)}{busy && <div className="typing"><span className="typing-dots"><i /><i /><i /></span>{t.typing}</div>}<div ref={endRef} /></div>}
          </div>
          <div className="composer-area"><button className="help-button" onClick={() => openHelp(messages.at(-1)?.role === 'user' ? messages.at(-1)?.content : '')}><HeartHandshake size={17} /><span>{t.request}</span><span className="help-arrow">{dir === 'rtl' ? '←' : '→'}</span></button><form className="composer" onSubmit={event => { event.preventDefault(); sendMessage() }}><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); sendMessage() } }} placeholder={t.prompt} aria-label={t.prompt} rows={1} /><button className="send-button" type="submit" disabled={!draft.trim() || busy} aria-label={t.send}><ArrowUp size={18} /></button></form><p className="composer-foot"><LockKeyhole size={12} />{locale === 'ar' ? 'لا تكتبي معلومات تعريفية إذا لم يكن ذلك آمنًا لكِ.' : 'Ne partagez pas d’informations identifiantes si cela ne vous semble pas sûr.'}</p></div>
        </section>
        <footer className="page-foot"><span><Clock3 size={14} />{locale === 'ar' ? 'خذي وقتكِ. لا داعي للاستعجال.' : 'Prenez votre temps. Rien ne presse.'}</span><span>AMAN · TUNISIA</span></footer>
      </section>

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(false) }}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="modal-close" onClick={() => setModal(false)} aria-label={t.close}><X size={18} /></button>{submitted ? <div className="confirmation"><div className="confirmation-icon"><Check size={27} /></div><div className="modal-kicker">{t.title} · {t.assistant}</div><h2 id="help-title">{t.sentTitle}</h2><p>{t.sentBody}</p><button className="submit-help" onClick={() => setModal(false)}>{t.done}</button></div> : <><div className="modal-icon"><HeartHandshake size={22} /></div><div className="modal-kicker">{locale === 'ar' ? 'دعم آمن وسري' : 'Soutien sûr et confidentiel'}</div><h2 id="help-title">{t.help}</h2><p className="modal-intro">{locale === 'ar' ? 'اختاري طريقة تواصل آمنة بالنسبة لكِ. مشاركة معلومات التواصل اختيارية.' : 'Choisissez un moyen de contact sûr pour vous. Les coordonnées sont facultatives.'}</p><form className="help-form" onSubmit={submitHelp}><label>{t.method}<select value={contactMethod} onChange={event => setContactMethod(event.target.value)}><option value="Telegram">{t.telegram}</option><option value="WhatsApp">{t.whatsapp}</option><option value="Phone Call">{t.phone}</option><option value="Signal">{t.signal}</option></select></label><label>{t.handle}<input value={contact} onChange={event => setContact(event.target.value)} autoComplete="off" placeholder={locale === 'ar' ? 'اختياري' : 'Facultatif'} /></label><label>{t.urgency}<select value={urgency} onChange={event => setUrgency(event.target.value)}><option value="low">{t.low}</option><option value="medium">{t.medium}</option><option value="high">{t.high}</option></select></label><label>{t.message}<textarea value={helpMessage} onChange={event => setHelpMessage(event.target.value)} rows={4} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-actions"><button type="button" className="cancel-button" onClick={() => setModal(false)}>{t.cancel}</button><button type="submit" className="submit-help" disabled={formBusy}>{formBusy ? '…' : t.submit}</button></div></form><p className="modal-safety"><LockKeyhole size={13} />{t.privacy}</p></>}</section></div>}
    </main>
  )
}
