import dotenv from 'dotenv';
dotenv.config();

console.log('Environment loaded check:');
console.log('- GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
console.log('- MINIMAX_API_KEY present:', !!process.env.MINIMAX_API_KEY);
console.log('- OPEN_ROUTER_API_KEY present:', !!(process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY));
console.log('- OLLAMA_URL:', process.env.OLLAMA_URL);

import app from './app';
import { IngestionService } from './ia/ingestion.service';

const PORT = process.env.PORT || 3001;

// Iniciar observador de facturas físicas en la carpeta uploads/facturas
IngestionService.startWatching();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
