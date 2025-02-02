import { LightningElement, api, track } from 'lwc';
import GetSummary from '@salesforce/apex/LedgerSummaryController.GetSummary';
import GetMasterSummary from '@salesforce/apex/LedgerSummaryController.GetMasterSummary';

const validTypes = ['Asset', 'Liability', 'Income', 'Expense','Equity'];
const typeNameMap = [
    ['Asset','asset'],
    ['Liability','liability'],
    ['Income','income'],
    ['Expense','expense'],
    ['Equity','equity'],
    ['Profit / Loss','profitLoss']
];

const exampleSingleSummary = {
    "label": "Asset",
    "type": "asset",
    "totalCredit": 0.00,
    "totalDebit": 0.00,
    "GetBalance": 0.00,
    "count":0
};
const exampleMasterSummary = [
    {
        "label":"Current",
        "name":"current",
        "asset": 0.00,
        "liability": 0.00,
        "income": 0.00,
        "expense": 0.00,
        "equity": 0.00,
        "profitLoss": 0.00
    },
    {
        "label":"Future",
        "name":"future",
        "asset": 0.00,
        "liability": 0.00,
        "income": 0.00,
        "expense": 0.00,
        "equity": 0.00,
        "profitLoss": 0.00
    }
];

export default class LedgerSummary extends LightningElement {

    @api recordId;
    @api ledgerType;
    @api masterSummary = false;

    get summaryTitle() {
        return (this.masterSummary ? 'Master' : (this.ledgerType ?? 'Ledger'))+' Summary';
    }

    async connectedCallback() {

        if(!this.recordId) {
            await this.getFinanceAccountId();
        } else {
            this.financeAccountId = this.recordId;
        }
       
        if(!this.financeAccountId) {
            this.handleError(true,'No Finance Account Id Set');
            return;
        }

        if(this.masterSummary == true) {
            await this.getMasterSummaryDetails();
        } else {
            await this.getSummaryDetails();
        }
    }

    @track financeAccountId;
    async getFinanceAccountId() {
        console.log(Object.keys(sessionStorage));
        const accountId = sessionStorage.getItem('FINANCE_ACCOUNT_ID');
        this.debugMessage('FINANCE_ACCOUNT_ID: ' + accountId);
        this.financeAccountId = accountId;
    }

    get currencyCode() {
        return 'GBP';
    }

    _masterSummaryDetails = exampleMasterSummary;
    get masterSummaryDetails() {
        return this._masterSummaryDetails;
    }

    async getMasterSummaryDetails() {
        this.handleError(false,null);
        this.debugMessage('Get Master Summary Details');

        try {
            const data = await GetMasterSummary({ financeAccountId: this.financeAccountId });
            this.debugMessage('Master Summary Details Data: '+JSON.stringify(data));
            this._masterSummaryDetails = data;
        } catch (error) {
            this.handleError(true,'Master Summary Details Error: '+JSON.stringify(error));
        }
    }

    _summaryDetails = exampleSingleSummary;
    get summaryDetails() {
        return this._summaryDetails;
    }
    async getSummaryDetails() {
        this.handleError(false,null);
        this.debugMessage('Get Summary Details');

        if(validTypes.includes(this.ledgerType)) {
            try {
                const name = typeNameMap[this.ledgerType];
                this.debugMessage('Summary Name: '+name)
                const data = await GetSummary({ financeAccountId: this.financeAccountId, ledgerType: this.ledgerType, name: name });
                this.debugMessage('Summary Details Data: '+JSON.stringify(data));
                this._summaryDetails = data;
            } catch (error) {
                this.handleError(true,'Summary Details Error: '+JSON.stringify(error));
            }
        } else {
            this.handleError(true,'Invalid Ledger Type');
        }
    }

    handleAddLedger(event) {
        this.debugMessage('Handle Add Ledger');
        this.refreshData();
    }

    handleRefreshSummary(event) {
        this.debugMessage('Handle Add Ledger');
        this.refreshData();
    }

    refreshData() {
        this.debugMessage('Refresh Data');
    }

    @track hasError;
    @track errorMessage;
    handleError(error,message) {
        if(error == true) {
            this.debugMessage('Error Message: '+message);
            this.errorMessage = message;
            this.hasError = error;
        } else {
            this.errorMessage = undefined;
            this.hasError = false;
        }
    }

    @api debug;
    debugMessage(message) {
        if(this.debug == false) return;
        console.log(message);
    }
}