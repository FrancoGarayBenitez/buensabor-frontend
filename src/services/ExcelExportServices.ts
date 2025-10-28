import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

// Define el tipo para los datos que se pueden exportar
type ExportableData = Record<string, any>[];

/**
 * Exporta un array de objetos a un archivo de Excel (.xlsx).
 * @param data - El array de objetos a exportar. Las claves de los objetos serán las cabeceras.
 * @param fileName - El nombre del archivo sin la extensión.
 */
export const exportToExcel = (data: ExportableData, fileName: string): void => {
  // 1. Crear una hoja de cálculo a partir de los datos JSON
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

  // 2. Crear un nuevo libro de trabajo
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();

  // 3. Añadir la hoja de cálculo al libro de trabajo con el nombre "Datos"
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // 4. Escribir el libro de trabajo en un buffer (formato binario de Excel)
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 5. Crear un Blob (Binary Large Object) para el archivo
  const blobData: Blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF--8',
  });

  // 6. Usar FileSaver para descargar el archivo
  FileSaver.saveAs(blobData, `${fileName}.xlsx`);
};