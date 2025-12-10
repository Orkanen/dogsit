export default function VerificationModal({ petId, onClose, onSuccess }) {
    const [kennels, setKennels] = useState([]);
    const [selected, setSelected] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
  
    // Load kennels on mount
    useEffect(() => {
      api.kennel.getKennels().then(setKennels);
    }, []);
  
    const submit = async () => {
      setLoading(true);
      try {
        await api.kennel.requestPetLink(Number(selected), petId, message);
        alert("Request sent!");
        onSuccess();
        onClose();
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="modal">
        <h3>Request Kennel Verification</h3>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Choose kennel...</option>
          {kennels.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
        <textarea
          placeholder="Message to kennel owner..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={submit} disabled={loading || !selected}>
          Send Request
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  }