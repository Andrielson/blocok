import { Component, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';

interface DadosExtras {
  id: number;
  codigo: string;
  quantidade: number;
  linha: string;
}

interface ProdutoK200 { //|K200|30092019|PSA0092|366,930|1|8406|
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
      <label class="custom-file-label" for="customFile">{{labelInputArquivo}}</label>
    </div>
    <div class="mt-3">
      <ag-grid-angular
        #agGrid
        style="width: 100%; height: 600px;" 
        class="ag-theme-balham"
        [rowData]="dadosK200" 
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

  private dados0000a0100: string[] = []; // |0000|,|0001|,|0005|,|0100|
  private dados0150: DadosExtras[] = [];
  private dados0190: DadosExtras[] = [];
  private dados0200: DadosExtras[] = [];
  private contador0990: number;
  private dadosB001aK100: string[] = []; // |B001|,|B990|,|C001|,|C990|,|D001|,|D990|,|E001|,|E100|,|E110|,|E990|,|G001|,|G990|,|H001|,|H005|,|H990|,|K001|,|K100|
  public dadosK200: ProdutoK200[] = [];
  private contadorK990: number;
  private dados1001a9900_0100: string[] = [];
  private dados9900_0990a9900_K100: string[] = [];
  private dados9900_K990a9990: string[] = [];
  private contador9999: number;

  public labelInputArquivo = 'Selecione o arquivo';

  public columnDefs = [
    { headerName: 'Prefixo', field: 'prefixo' },
    { headerName: 'Data', field: 'data' },
    { headerName: 'Código', field: 'codigo', filter: true, checkboxSelection: true },
    { headerName: 'Quantidade', field: 'quantidade', editable: true },
    { headerName: 'Posição', field: 'posicao' },
    { headerName: 'Fornecedor', field: 'fornecedor' }
  ];

  public defaultColDef = {
    resizable: true
  };

  private processaLinhas(linhas: string[]) {
    const prefs0000a0100 = ['|0000|', '|0001|', '|0005|', '|0100|'];
    const prefsB001aK100 = ['|B001|', '|B990|', '|C001|', '|C990|', '|D001|', '|D990|', '|E001|', '|E100|', '|E110|', '|E990|', '|G001|', '|G990|', '|H001|', '|H005|', '|H990|', '|K001|', '|K100|'];
    const prefs1001a9001 = ['|1001|', '|1010|', '|1990|', '|9001|'];
    const prefs9900_0000a0100 = prefs0000a0100;
    const prefs9900_0990aK100 = ['|0990|'].concat(prefsB001aK100);
    const prefs9900_K990a9900 = ['|K990|'].concat(prefs1001a9001, ['|9990|', '|9999|', '|9900|']);
    const prefSplit = ['|0150|', '|0190|', '|0200|', '|0990|', '|K200|', '|K990|', '|9999|'];
    const gambiarra: ProdutoK200[] = [];

    linhas.forEach((l, i) => {
      const p = l.slice(0, 6);
      let d: string[];

      if (prefSplit.includes(p)) {
        d = l.split('|');
      }

      switch (p) {
        case '|0150|':
          this.dados0150.push({
            id: i,
            codigo: d[2],
            linha: l,
            quantidade: 0
          });
          break;
        case '|0190|':
          this.dados0190.push({
            id: i,
            codigo: d[2],
            linha: l,
            quantidade: 0
          });
          break;
        case '|0200|':
          this.dados0200.push({
            id: i,
            codigo: d[2],
            linha: l,
            quantidade: 0
          });
          break;
        case '|0990|':
          this.contador0990 = Number(d[2]);
          break;
        case '|K200|':
          const k = {
            prefixo: d[1],
            data: d[2],
            codigo: d[3],
            quantidade: d[4],
            posicao: d[5],
            fornecedor: d[6]
          };
          gambiarra.push(k);
          break;
        case '|K990|':
          this.contadorK990 = Number(d[2]);
          break;
        case '|9900|':

          break;
        case '|9990|':
          this.dados9900_K990a9990.push(l);
          break;
        case '|9999|':
          this.contador9999 = Number(d[2]);
          break;
        default:
          if (prefs0000a0100.includes(p)) {
            this.dados0000a0100.push(l);
          } else if (prefsB001aK100.includes(p)) {
            this.dadosB001aK100.push(l);
          } else if (prefs1001a9001.includes(p)) {
            this.dados1001a9900_0100.push(l);
          }
          break;
      }
    });
    this.dadosK200 = gambiarra;
  }

  public onFileInputChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length === 1) {
      this.labelInputArquivo = target.files.item(0).name;
      const reader = new FileReader();
      reader.onload = () => {
        const texto = reader.result as string;
        const linhas: string[] = texto.split(/\r\n|\n/);
        this.processaLinhas(linhas);
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
