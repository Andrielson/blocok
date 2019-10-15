import { Component, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';

interface produtoK { //|K200|30092019|PSA0092|366,930|1|8406|
  prefixo: string, //|K200|
  data: string, //|30092019|
  codigo: string, //|PSA0092|
  quantidade: string, //|366,930|
  posicao: string, //|1|
  fornecedor?: string //|8406|
}

@Component({
  selector: 'app-root',
  template: `
  <div class="container">
    <h1 class="text-center">Bloco K</h1>
    <div class="custom-file">
      <input type="file" class="custom-file-input" id="customFile" (change)="onFileInputChange($event)">
      <label class="custom-file-label" for="customFile">{{nomeDoArquivo}}</label>
    </div>
    <div class="mt-3">
      <ag-grid-angular
        #agGrid
        style="width: 100%; height: 700px;" 
        class="ag-theme-balham"
        [rowData]="rowData" 
        [columnDefs]="columnDefs"
        [defaultColDef]="defaultColDef"
        >
      </ag-grid-angular>
    </div>
    <button type="button" class="btn btn-danger" (click)="onClickRemover()">Remover selecionados</button>
  </div>
  `,
  styles: []
})
export class AppComponent {
  @ViewChild('agGrid', { static: true }) private agGrid: AgGridAngular;
  private columnDefs = [
    { headerName: 'Prefixo', field: 'prefixo' },
    { headerName: 'Data', field: 'data' },
    { headerName: 'Código', field: 'codigo', filter: true, checkboxSelection: true },
    { headerName: 'Quantidade', field: 'quantidade' },
    { headerName: 'Posição', field: 'posicao' },
    { headerName: 'Fornecedor', field: 'fornecedor' }
  ];

  private rowData: produtoK[] = [];

  private nomeDoArquivo = 'Selecione o arquivo';

  private defaultColDef = {
    resizable: true
  };

  private arquivoOriginal: string;

  public onFileInputChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length === 1) {
      this.nomeDoArquivo = target.files.item(0).name;
      const reader = new FileReader();
      reader.onload = () => {
        this.arquivoOriginal = reader.result as string;
        const linhas: string[] = this.arquivoOriginal.split(/\r\n|\n/);
        this.rowData = linhas.filter(l => l.startsWith('|K200|'))
          .map(l => {
            const k = l.split('|');
            return {
              prefixo: k[1],
              data: k[2],
              codigo: k[3],
              quantidade: k[4],
              posicao: k[5],
              fornecedor: k[6]
            }
          });
        this.agGrid.api.sizeColumnsToFit();
      };

      reader.onerror = () => {
        alert('Não foi possível ler o arquivo ' + target.files[0]);
      };

      reader.readAsText(target.files.item(0));
    }
  }

  public onClickRemover() {
    const selecionados = this.agGrid.api.getSelectedRows();
    if (selecionados.length > 0)
      this.agGrid.api.updateRowData({ remove: selecionados });
    else
      alert('Não há produtos selecionados!');
  }
}
