import { useEffect, useRef, useState } from 'react'
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import Harubang from '../components/Harubang'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

export default function Agent() {
  const t = useT()
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [input, setInput] = useState('')
  const bottom = useRef(null)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function send(text) {
    if (!text.trim() || loading) return
    sendMessage(text)
    setInput('')
  }

  return (
    <>
      <PageHeader icon="robot" title={t('agentTitle')} subtitle={t('agentSub')} />
      <Card className="mb-3">
        <Card.Body className="chat-box d-flex flex-column gap-2">
          {messages.length === 0 && (
            <div className="m-auto text-center">
              <Harubang mood="happy" size={90} />
              <div className="small fw-bold text-muted mt-2 mb-2">{t('agentHint')}</div>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {['q1', 'q2', 'q3'].map((k) => (
                  <Button key={k} size="sm" variant="outline-primary" className="rounded-pill" onClick={() => send(t(k))}>{t(k)}</Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.steps?.length > 0 && (
                <div className="small text-info mb-1">
                  <i className="bi bi-tools me-1" />
                  {m.steps.map((s) => `${s.tool}(${JSON.stringify(s.args)}) → ${s.count}`).join(' · ')}
                </div>
              )}
              {m.text}
            </div>
          ))}
          {loading && <div className="small text-muted"><Spinner size="sm" className="me-2" />{t('thinking')}</div>}
          <div ref={bottom} />
        </Card.Body>
      </Card>
      <Form onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('placeholder')} />
          <Button type="submit" disabled={loading}><i className="bi bi-send" /></Button>
        </InputGroup>
      </Form>
    </>
  )
}
