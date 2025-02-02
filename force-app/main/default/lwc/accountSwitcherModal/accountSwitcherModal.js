import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';

export default class AccountSwitcherModal extends LightningModal {

    @api modalTitle = 'Account Switcher';

    @api currentAccountId;

    connectedCallback() {
        this.disableClose = this.currentAccountId ? false : true;
    }
    
    @api accounts = [];
    get accountOptions() {
        if(this._searchTerm == undefined || this._searchTerm == null || this._searchTerm == '') return this.accounts;
        return this.accounts.filter(account => account.Name.toLowerCase().includes(this._searchTerm.toLowerCase()));
    }

    @api hasError;
    @api errorMessage;

    @track _searchTerm;
    async handleAccountSearch(event) {
        const searchTerm = event.target.value;
        this.debugMessage('Search Term: '+searchTerm);
        this._searchTerm = searchTerm;
    }

    async handleSelectAccount(event) {
        this.debugMessage('Handle Select Account');
        
        const accountId = event.target.dataset.id;
        this.debugMessage('Account Id: '+accountId);
        this.currentAccountId = accountId;
        
        const account = this.accounts.find(account => account.Id === accountId);
        this.debugMessage('Account: '+JSON.stringify(account));
        if(!account) this.handleError('Invalid Selection');
        this.disableClose = false;
        this.close(account);
    }

    handleError(message) {
        this.hasError = true;
        this.errorMessage = message;
        this.debugMessage(message); 
    }

    @api debug;
    debugMessage(message) {
        if(this.debug == false) return;
        console.log(message);
    }
}