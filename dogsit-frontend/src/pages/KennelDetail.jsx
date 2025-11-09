import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

const linkStyle = { color: '#1d4ed8', textDecoration: 'underline', fontWeight: '500' }

export default function KennelDetail() {
  const { id } = useParams();
  return <div>Kennel ID: {id} – details coming soon <Link to="/kennels" style={linkStyle}>Back to Kennels</Link></div>;
}