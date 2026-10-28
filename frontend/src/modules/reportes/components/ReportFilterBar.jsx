import React from 'react';
import { Filter, FileSpreadsheet, Printer } from 'lucide-react';

export const ReportFilterBar = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  onFilter,
  onExportExcel,
  onPrint,
  extraFilters,
  loading = false,
  showDates = true,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="filter-bar">
      <div className="filter-controls-container">
        {showDates && (
          <div className="filter-dates-wrapper">
            <div className="filter-group">
              <label className="filter-label">Fecha Desde</label>
              <input
                type="date"
                className="filter-input"
                value={fechaDesde || ''}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Fecha Hasta</label>
              <input
                type="date"
                className="filter-input"
                value={fechaHasta || ''}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>
        )}

        {extraFilters}

        <div className="filter-buttons-wrapper">
          {onFilter && (
            <button
              type="button"
              className="btn-action btn-primary"
              onClick={onFilter}
              disabled={loading}
              title="Aplicar filtros a los datos"
            >
              <Filter size={14} />
              {loading ? 'Consultando...' : 'Filtrar'}
            </button>
          )}
        </div>
      </div>

      <div className="filter-actions">
        {onExportExcel && (
          <button
            type="button"
            className="btn-action btn-success"
            onClick={onExportExcel}
            disabled={loading}
            title="Descargar en formato Excel (.xlsx)"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
        )}

        <button
          type="button"
          className="btn-action btn-accent"
          onClick={handlePrint}
          title="Imprimir o guardar como PDF oficial"
        >
          <Printer size={14} />
          Imprimir / PDF
        </button>
      </div>
    </div>
  );
};

export default ReportFilterBar;
