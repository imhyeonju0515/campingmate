import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Form, InputGroup } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import Harubang from '../components/Harubang'
import { useArea, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TYPE_KEY = { normal: 't_normal', car: 't_car', glamp: 't_glamp', caravan: 't_caravan' }

export default function Agent() {
  const t = useT()
  const area = useArea()
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
                {['q1', 'q2', 'q3', 'q4'].map((k) => (
                  <Button key={k} size="sm" variant="outline-primary" className="rounded-pill" onClick={() => send(t(k))}>{t(k)}</Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (m.role === 'user' ? (
            <div key={i} className="msg user">{m.text}</div>
          ) : (
            // 하르방이 말풍선으로 답하고, 추천 캠핑장은 눌러서 상세로 갈 수 있는 목록으로 보여 줍니다
            <div key={i} className="d-flex align-items-start gap-2 agent-row">
              <div className="flex-shrink-0"><Harubang mood="happy" size={52} /></div>
              <div className="bubble agent-bubble">
                {m.text && <div>{m.text}</div>}
                {m.plan?.days?.length > 0 && (
                  <div className="agent-plan mt-2">
                    {m.plan.title && <div className="fw-bold mb-1"><i className="bi bi-signpost-split text-primary me-1" />{m.plan.title}</div>}
                    {m.plan.days.map((d, di) => (
                      <div key={di} className="mb-2">
                        <div className="agent-plan-day">{d.label}</div>
                        <ul className="list-unstyled mb-0">
                          {d.items.map((it, ii) => (
                            <li key={ii} className="agent-plan-item">
                              <span className="agent-plan-time">{it.time}</span>
                              <span>
                                {it.text}
                                {it.camp && <Link to={`/camps/${encodeURIComponent(it.camp.id)}`} className="agent-chip"><i className="bi bi-tree me-1" />{it.camp.name}</Link>}
                                {it.spot && <Link to={`/stories?spot=${encodeURIComponent(it.spot.id)}`} className="agent-chip"><i className="bi bi-signpost-2 me-1" />{it.spot.name}</Link>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {m.camps?.length > 0 && (
                  <ul className="agent-camps list-unstyled mb-0 mt-2">
                    {m.camps.map((c) => (
                      <li key={c.id}>
                        <Link to={`/camps/${encodeURIComponent(c.id)}`} className="agent-camp">
                          <span className="d-flex flex-wrap align-items-center gap-1">
                            <b>{c.name}</b>
                            <Badge bg="info">{area(c.region)}</Badge>
                            {c.types?.map((x) => <Badge key={x} bg="light" text="dark">{t(TYPE_KEY[x])}</Badge>)}
                          </span>
                          {c.note && <span className="small d-block mt-1">{c.note}</span>}
                          <i className="bi bi-chevron-right agent-camp-go" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )))}
          {loading && (
            <div className="d-flex align-items-start gap-2 agent-row">
              <div className="flex-shrink-0"><Harubang mood="normal" size={52} /></div>
              <div className="bubble"><span className="spinner-border spinner-border-sm me-2" />{t('thinking')}</div>
            </div>
          )}
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
