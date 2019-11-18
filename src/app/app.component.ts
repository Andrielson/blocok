import { Component, ViewChild } from '@angular/core';
import { AgGridAngular } from '@ag-grid-community/angular';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { isUndefined } from 'util';

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
  status: string;
}

interface ProdutoINVT {
  codigo: string;
  quantidade: string;
  fornecedor: string;
}

const LN = '\r\n';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  @ViewChild('agGrid', { static: false })
  private agGrid: AgGridAngular;

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
  public labelInputFileTxt = 'Selecione o arquivo TXT (Bloco K)';
  public labelInputFileXlsx = 'Selecione o arquivo XLSX (Inventário)';
  public inputFileXlsxStatus = true;
  public columnDefs = [
    { headerName: 'Prefixo', field: 'prefixo' },
    { headerName: 'Data', field: 'data' },
    { headerName: 'Código', field: 'codigo', checkboxSelection: true },
    { headerName: 'Quantidade', field: 'quantidade', editable: true },
    { headerName: 'Posição', field: 'posicao' },
    { headerName: 'Fornecedor', field: 'fornecedor' },
    { headerName: 'Status', field: 'status' },
  ];
  public defaultColDef = {
    resizable: true,
    enableCellChangeFlash: true,
  };
  public getRowNodeId = (data: ProdutoK200) => `${data.codigo}|${data.posicao}|${data.fornecedor}`;
  public modules = AllCommunityModules;
  public rowClassRules = {
    'adicionado': "data.status === 'adicionado'",
    'modificado': "data.status === 'modificado'",
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
            fornecedor: d[6],
            status: 'original',
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

  private removeK200(k200: ProdutoK200) {
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
  }

  public onFileInputTxtChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length === 1) {
      this.labelInputFileTxt = target.files.item(0).name;
      const reader = new FileReader();
      reader.onload = () => {
        const texto = reader.result as string;
        const linhas: string[] = texto.split(/\r\n|\n/);
        this.processaLinhas(linhas);
        this.agGrid.api.sizeColumnsToFit();
        this.inputFileXlsxStatus = false;
      };

      reader.onerror = () => {
        alert('Não foi possível ler o arquivo ' + target.files[0]);
      };

      reader.readAsText(target.files.item(0));
    }
  }

  public onFileInputXlsxChange(evt: any) {
    const files = evt.target.files;
    if (files.length === 1) {
      this.labelInputFileXlsx = files.item(0).name;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dados = new Uint8Array(reader.result as ArrayBuffer);
        const wb: XLSX.WorkBook = XLSX.read(dados, { type: 'array', cellDates: true, cellNF: true });
        const wst = wb.Sheets['Bloco K Componentes Terceiros '];
        const wsp = wb.Sheets['Bloco K'];
        const invt: ProdutoINVT[] = [];

        /* Bloco K Componentes Terceiros */
        const itemsToUpdate: ProdutoK200[] = [];
        let nl = 2;
        while (true) {
          const l = nl.toString();
          if (isUndefined(wst[`C${l}`])) {
            break;
          }
          const codigo = wst[`C${l}`].w.replace(',', '.').toUpperCase();
          const quantidade = parseFloat(wst[`E${l}`].w.replace(',', '')).toFixed(3).replace('.', ',');
          const fornecedor = wst[`A${l}`].w;

          const k200 = this.dadosK200.find(k => k.posicao === '1' && k.codigo === codigo && k.fornecedor === fornecedor);
          if (k200) {
            if (quantidade === '0,000') {
              this.removeK200(k200);
            } else if (k200.quantidade !== quantidade) {
              k200.quantidade = quantidade;
              k200.status = 'modificado';
              const rowNode = this.agGrid.api.getRowNode(`${k200.codigo}|${k200.posicao}|${k200.fornecedor}`);
              const data = rowNode.data;
              data.quantidade = quantidade;
              data.status = 'modificado';
              itemsToUpdate.push(data);
            }
          } else if (quantidade !== '0,000') {
            // Procura pelo fornecedor
            const forne = this.dados0150.find(f => f.codigo === fornecedor);
            // Procura pelo produto
            const produ = this.dados0200.find(p => p.codigo === codigo);

            if (forne && produ) {
              this.setFornecedor(fornecedor, +1);
              this.setProdutoUnidade(codigo, +1);
              const pk200: ProdutoK200 = {
                id: 2000,
                prefixo: 'K200',
                data: this.dadosK200[0].data,
                posicao: '1',
                status: 'adicionado',
                codigo,
                fornecedor,
                quantidade,
              };
              const i = this.dadosK200.findIndex(k => k.posicao === '1' && k.codigo >= codigo && k.fornecedor >= fornecedor);
              this.dadosK200.splice(i, 0, pk200);
              this.contadorK990++;
              this.contador9999++;
              this.agGrid.api.setRowData(this.dadosK200);
            } else {
              invt.push({ codigo, quantidade, fornecedor });
            }
          }
          nl++;
        }

        /* Bloco K */
        nl = 2;
        while (true) {
          const l = nl.toString();
          if (isUndefined(wsp[`A${l}`])) {
            break;
          }
          const codigo = wsp[`A${l}`].w.replace(',', '.').toUpperCase();
          const quantidade = parseFloat(wsp[`C${l}`].w.replace(',', '')).toFixed(3).replace('.', ',');
          const fornecedor = '';

          const k200 = this.dadosK200.find(k => k.posicao === '0' && k.codigo === codigo);
          if (k200) {
            if (quantidade === '0,000') {
              this.removeK200(k200);
            } else if (k200.quantidade !== quantidade) {
              k200.quantidade = quantidade;
              k200.status = 'modificado';
              const rowNode = this.agGrid.api.getRowNode(`${k200.codigo}|${k200.posicao}|${k200.fornecedor}`);
              const data = rowNode.data;
              data.quantidade = quantidade;
              data.status = 'modificado';
              itemsToUpdate.push(data);
            }
          } else if (quantidade !== '0,000') {
            // Procura pelo produto
            const produ = this.dados0200.find(p => p.codigo === codigo);

            if (produ) {
              this.setFornecedor(fornecedor, +1);
              this.setProdutoUnidade(codigo, +1);
              const pk200: ProdutoK200 = {
                id: 2000,
                prefixo: 'K200',
                data: this.dadosK200[0].data,
                posicao: '0',
                status: 'adicionado',
                codigo,
                fornecedor,
                quantidade,
              };
              const i = this.dadosK200.findIndex(k => k.posicao === '0' && k.codigo >= codigo);
              this.dadosK200.splice(i, 0, pk200);
              this.contadorK990++;
              this.contador9999++;
              this.agGrid.api.setRowData(this.dadosK200);
            } else {
              invt.push({ codigo, quantidade, fornecedor });
            }
          }
          nl++;
        }
        console.warn('Faltam inserir:', invt);
        this.agGrid.api.updateRowData({ update: itemsToUpdate });
      };

      reader.onerror = () => {
        alert('Não foi possível ler o arquivo ' + files.item(0).name);
      };

      reader.readAsArrayBuffer(files.item(0));
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
        this.removeK200(k200);
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
      const rowNode = this.agGrid.api.getRowNode(`${k200.codigo}|${k200.posicao}|${k200.fornecedor}`);
      if (rowNode) {
        this.agGrid.api.ensureIndexVisible(rowNode.rowIndex, 'middle');
        this.agGrid.api.flashCells({ rowNodes: [rowNode] });
        this.agGrid.api.selectNode(rowNode);
      }
    }
  }
}
