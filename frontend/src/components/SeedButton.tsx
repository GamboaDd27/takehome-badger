import { seedDb } from '../services/api';
import { Database } from 'lucide-react';

interface SeedButtonProps {
  onSeed: () => void;
}

const SeedButton: React.FC<SeedButtonProps> = ({ onSeed }) => {
  const handleClick = async () => {
    try {
      await seedDb();
      onSeed(); // trigger refresh
    } catch (err) {
      console.error('Seeding failed', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition"
    >
      <Database className="w-4 h-4 mr-2" />
      Seed DB
    </button>
  );
};

export default SeedButton;
