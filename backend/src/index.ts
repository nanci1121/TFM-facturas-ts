import app from './app';
import { IngestionService } from './ia/ingestion.service';

const PORT = process.env.PORT || 3001;

// Iniciar observador de facturas físicas en la carpeta uploads/facturas
IngestionService.startWatching();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
