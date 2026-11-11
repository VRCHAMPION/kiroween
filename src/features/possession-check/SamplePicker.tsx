import { SAMPLES, type Channel } from '../../data/samples';

const CHANNEL: Readonly<Record<Channel, string>> = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' };

interface SamplePickerProps {
  value: string;
  onPick: (id: string) => void;
  disabled?: boolean;
}

export function SamplePicker({ value, onPick, disabled = false }: SamplePickerProps) {
  return (
    <div className="field">
      <label htmlFor="sample-picker">Try a sample</label>
      <select id="sample-picker" value={value} disabled={disabled} onChange={(event) => onPick(event.target.value)}>
        <option value="">Choose a sample message</option>
        {SAMPLES.map((sample) => (
          <option key={sample.id} value={sample.id}>
            {CHANNEL[sample.channel]}: {sample.title}
          </option>
        ))}
      </select>
    </div>
  );
}