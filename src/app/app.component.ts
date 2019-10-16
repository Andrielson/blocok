import { Component, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { saveAs } from 'file-saver';

interface DadosExtras {
  id: number;
  codigo: string;
  quantidade: number;
  linha: string;
}

interface ProdutoK200 {
  id: number;
  prefixo: string;
  data: string;
  codigo: string;
  quantidade: string;
  posicao: string;
  fornecedor: string;
}

const LN = '\r\n';

@Component({
  selector: 'app-root',
  template: `
  <div class="container mt-3">
    <div class="row">
      <div class="col-9">
        <div class="custom-file">
          <input type="file" class="custom-file-input" id="customFile" (change)="onFileInputChange($event)">
          <label class="custom-file-label" for="customFile">{{labelInputArquivo}}</label>
        </div>
      </div>
      <div class="col-3">
        <input class="form-control" type="text" placeholder="Filtro rápido..." #filtro (input)="agGrid.api.setQuickFilter(filtro.value)" />
      </div>
    </div>
    <div class="row mt-3">
      <div class="col">
        <ag-grid-angular
          #agGrid
          style="width: 100%; height: 630px;" 
          class="ag-theme-balham" 
          [rowData]="dadosK200" 
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          >
        </ag-grid-angular>
      </div>
    </div>
    <div class="row justify-content-around mt-3">
      <div class="col-sm-2">
        <button type="button" class="btn btn-danger" (click)="onClickRemover()">Remover produto</button>
      </div>
      <div class="col-sm-2">
        <button type="button" class="btn btn-warning" [disabled]="dadosK200Removidos.length === 0" (click)="onClickDesfazerExclusao()">Desfazer exclusão</button>
      </div>
      <div class="col-sm-2">
        <button type="button" class="btn btn-primary" [disabled]="dadosK200.length === 0" (click)="onClickBaixarArquivo()">Baixar arquivo</button>
      </div>
    </div>
  </div>
  `,
  styles: []
})
export class AppComponent {
  @ViewChild('agGrid', { static: true }) private agGrid: AgGridAngular;

  private dados0000a0100: string[] = [];
  private dados0150: DadosExtras[] = [];
  private dados0190: DadosExtras[] = [];
  private dados0200: DadosExtras[] = [];
  private contador0990: number;
  private dadosB001aK100: string[] = [];
  private contadorK990: number;
  private dados1001a9900_0100: string[] = [];
  private dados9900_0990a9900_K100: string[] = [];
  private dados9900_K990a9990: string[] = [];
  private contador9999: number;

  public dadosK200: ProdutoK200[] = [];
  public dadosK200Removidos: ProdutoK200[] = [];
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
    resizable: true,
    enableCellChangeFlash: true
  };

  private processaLinhas(linhas: string[]) {
    const prefs0000a0100 = ['|0000|', '|0001|', '|0005|', '|0100|'];
    const prefsB001aK100 = ['|B001|', '|B990|', '|C001|', '|C990|', '|D001|', '|D990|', '|E001|', '|E100|', '|E110|', '|E990|', '|G001|', '|G990|', '|H001|', '|H005|', '|H990|', '|K001|', '|K100|'];
    const prefs1001a9001 = ['|1001|', '|1010|', '|1990|', '|9001|'];
    const prefs9900_0000a0100 = prefs0000a0100;
    const prefs9900_0990aK100 = ['|0990|'].concat(prefsB001aK100);
    const prefs9900_K990a9900 = ['|K990|'].concat(prefs1001a9001, ['|9990|', '|9999|', '|9900|']);
    const prefSplit = ['|0150|', '|0190|', '|0200|', '|0990|', '|K200|', '|K990|', '|9999|'];

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
          // Incrementa o contador das unidades utilizadas
          this.dados0190.find(u => u.codigo === d[6]).quantidade++;
          break;
        case '|0990|':
          this.contador0990 = Number(d[2]);
          break;
        case '|K200|':
          const k = {
            id: i,
            prefixo: d[1],
            data: d[2],
            codigo: d[3],
            quantidade: d[4],
            posicao: d[5],
            fornecedor: d[6]
          };

          // Incrementa o contador dos fornecedores utilizados
          const f = this.dados0150.find(f => f.codigo === k.fornecedor);
          if (f) {
            f.quantidade++;
          }

          // Incrementa o contador dos produtos utilizados
          this.dados0200.find(p => p.codigo === k.codigo).quantidade++;

          this.dadosK200.push(k);
          break;
        case '|K990|':
          this.contadorK990 = Number(d[2]);
          break;
        case '|9900|':
          const p9900 = l.slice(5, 11);
          if (prefs9900_0000a0100.includes(p9900)) {
            this.dados1001a9900_0100.push(l);
          } else if (prefs9900_0990aK100.includes(p9900)) {
            this.dados9900_0990a9900_K100.push(l);
          } else if (prefs9900_K990a9900.includes(p9900)) {
            this.dados9900_K990a9990.push(l);
          }
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
    this.agGrid.api.setRowData(this.dadosK200);
  }

  private setFornecedor(codigo: string, q: number) {
    if (codigo.trim().length > 0) {
      const forne = this.dados0150.find(f => f.codigo === codigo);
      forne.quantidade += q;
      if (forne.quantidade <= 0) {
        this.contador0990--;
        this.contador9999--;
      } else if (q > 0 && forne.quantidade === 1) {
        this.contador0990++;
        this.contador9999++;
      }
    }
  }

  private setProdutoUnidade(codigo: string, q: number) {
    const pr = this.dados0200.find(p => p.codigo === codigo);
    const un = pr.linha.split('|')[6];
    const unid = this.dados0190.find(u => u.codigo === un);
    pr.quantidade += q;
    unid.quantidade += q;
    if (pr.quantidade <= 0 || unid.quantidade <= 0) {
      this.contador0990--;
      this.contador9999--;
    } else if (q > 0 && (pr.quantidade === 1 || unid.quantidade === 1)) {
      this.contador0990++;
      this.contador9999++;
    }
  }

  private getExtras(dados: DadosExtras[]): string {
    return dados.filter(d => d.quantidade > 0)
      .reduce((t, d) => t.concat(d.linha, LN), '');
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
    const selecionados = this.agGrid.api.getSelectedRows() as ProdutoK200[];
    if (selecionados.length === 0) {
      alert('Não há produtos selecionados!');
    } else if (selecionados.length > 1) {
      alert('Selecione apenas 1 produto!');
    } else {
      const k200 = selecionados[0];
      if (confirm(`Deseja excluir o produto ${k200.codigo}?`)) {
        const i = this.dadosK200.findIndex(k => k.id === k200.id);
        // Reduz a quantidade do fornecedor
        this.setFornecedor(k200.fornecedor, -1);
        // Reduz a quantidade do produto e da unidade
        this.setProdutoUnidade(k200.codigo, -1);
        // Insere na pilha de removidos
        this.dadosK200Removidos.push(k200);
        // Remove do array
        this.dadosK200.splice(i, 1);
        // Atualiza contador
        this.contadorK990--;
        this.contador9999--;
        // Atualiza grid
        this.agGrid.api.updateRowData({ remove: selecionados });
      }
    }
  }

  public onClickBaixarArquivo() {
    let arquivo: string;

    arquivo = this.dados0000a0100.join(LN).concat(LN);
    arquivo += this.getExtras(this.dados0150);
    arquivo += this.getExtras(this.dados0190);
    arquivo += this.getExtras(this.dados0200);
    arquivo += `|0990|${this.contador0990}|`.concat(LN);
    arquivo += this.dadosB001aK100.join(LN).concat(LN);
    arquivo += this.dadosK200.reduce((t, d) => t.concat(`|K200|${d.data}|${d.codigo}|${d.quantidade}|${d.posicao}|${d.fornecedor}|`, LN), '');
    arquivo += `|K990|${this.contadorK990}|`.concat(LN);
    arquivo += this.dados1001a9900_0100.join(LN).concat(LN);
    arquivo += `|9900|0150|${this.dados0150.filter(d => d.quantidade > 0).length}|`.concat(LN);
    arquivo += `|9900|0190|${this.dados0190.filter(d => d.quantidade > 0).length}|`.concat(LN);
    arquivo += `|9900|0200|${this.dados0200.filter(d => d.quantidade > 0).length}|`.concat(LN);
    arquivo += this.dados9900_0990a9900_K100.join(LN).concat(LN);
    arquivo += `|9900|K200|${this.dadosK200.length}|`.concat(LN);
    arquivo += this.dados9900_K990a9990.join(LN).concat(LN);
    arquivo += `|9999|${this.contador9999}|`.concat(LN);

    saveAs(new Blob([arquivo], { type: 'application/octet-stream' }), `BlocoK_${Date.now()}.txt`);
  }

  public onClickDesfazerExclusao() {
    if (this.dadosK200Removidos.length > 0) {
      const k200 = this.dadosK200Removidos.pop();
      const i = this.dadosK200.findIndex(k => k.id > k200.id);
      this.setFornecedor(k200.fornecedor, +1);
      this.setProdutoUnidade(k200.codigo, +1);
      this.dadosK200.splice(i, 0, k200);
      this.contadorK990++;
      this.contador9999++;
      this.agGrid.api.setRowData(this.dadosK200);
      this.agGrid.api.forEachNode(r => {
        if (r.data.id === k200.id) {
          this.agGrid.api.ensureIndexVisible(r.rowIndex, 'middle');
          this.agGrid.api.flashCells({ rowNodes: [r] });
          this.agGrid.api.selectNode(r);
          return;
        }
      });
    }
  }
}
