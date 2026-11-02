import { Link } from 'react-router-dom'
import Harubang from '../components/Harubang'
import { useT } from '../i18n'

export default function NotFound() {
  const t = useT()
  return (
    <div className="text-center py-5">
      <Harubang mood="worry" size={110} />
      <div className="display-1 text-primary fw-bold">404</div>
      <p className="lead">{t('notFound')}</p>
      <Link to="/" className="btn btn-primary"><i className="bi bi-house me-1" />{t('goHome')}</Link>
    </div>
  )
}
