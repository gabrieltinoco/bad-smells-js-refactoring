const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

const REPORT_TYPES = {
  CSV: 'CSV',
  HTML: 'HTML',
};

const USER_MAX_VALUE = 500;
const ADMIN_PRIORITY_MIN_VALUE = 1000;

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no formato solicitado e no perfil do usuário.
   * - Admins visualizam todos os itens.
   * - Usuários comuns visualizam apenas itens com valor <= 500.
   *
   * @param {'CSV'|'HTML'} reportType - Tipo de formato do relatório.
   * @param {{ name: string, role: 'ADMIN'|'USER' }} user - Dados do usuário solicitante.
   * @param {Array<{ id: number, name: string, value: number, priority?: boolean }>} items - Lista de itens.
   * @returns {string} Relatório formatado.
   */
  generateReport(reportType, user, items = []) {
    const visibleItems = this.getVisibleItems(items, user);
    const total = this.calculateTotal(visibleItems);

    if (reportType === REPORT_TYPES.CSV) {
      return this.generateCsvReport(user, visibleItems, total);
    }

    if (reportType === REPORT_TYPES.HTML) {
      return this.generateHtmlReport(user, visibleItems, total);
    }

    return '';
  }

  /**
   * Filtra e enriquece os itens visíveis de acordo com a role do usuário.
   */
  getVisibleItems(items, user) {
    return items
      .filter((item) => this.isItemVisibleForUser(item, user))
      .map((item) => this.enrichItem(item, user));
  }

  /**
   * Determina a visibilidade do item segundo as permissões da role.
   */
  isItemVisibleForUser(item, user) {
    if (user.role === ROLES.ADMIN) {
      return true;
    }
    if (user.role === ROLES.USER) {
      return item.value <= USER_MAX_VALUE;
    }
    return false;
  }

  /**
   * Aplica regras de negócio específicas (ex: prioridade para admins) sem mutar o objeto original.
   */
  enrichItem(item, user) {
    const isPriority = user.role === ROLES.ADMIN && item.value > ADMIN_PRIORITY_MIN_VALUE;
    return isPriority ? { ...item, priority: true } : { ...item };
  }

  /**
   * Calcula o valor total dos itens selecionados.
   */
  calculateTotal(items) {
    return items.reduce((accumulator, item) => accumulator + item.value, 0);
  }

  /**
   * Formata e renderiza o relatório em formato CSV.
   */
  generateCsvReport(user, items, total) {
    const header = 'ID,NOME,VALOR,USUARIO\n';
    const body = items
      .map((item) => `${item.id},${item.name},${item.value},${user.name}\n`)
      .join('');
    const footer = `\nTotal,,\n${total},,\n`;

    return `${header}${body}${footer}`.trim();
  }

  /**
   * Formata e renderiza o relatório em formato HTML.
   */
  generateHtmlReport(user, items, total) {
    const header = [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    ].join('\n');

    const body = items
      .map((item) => {
        const style = item.priority ? ' style="font-weight:bold;"' : '';
        return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
      })
      .join('');

    const footer = [
      '</table>',
      `<h3>Total: ${total}</h3>`,
      '</body></html>\n',
    ].join('\n');

    return `${header}${body}${footer}`.trim();
  }
}
