import { LightningElement, api, track, wire } from 'lwc';
import USER_ID from '@salesforce/user/Id';
import GetFinanceAccounts from '@salesforce/apex/FinanceAccountSwitcher.GetFinanceAccounts';
import AccountSwitcherModal from 'c/accountSwitcherModal';

export default class FinanceAccountSwitcher extends LightningElement {

    userId = USER_ID;

    availableAccounts = [];

    @api recordId;
    @api isRequired = false;

    @track isLoading = true;

    async connectedCallback() {
        if(!this.recordId) return;
        sessionStorage.setItem('FINANCE_ACCOUNT_ID', this.recordId); 
    }

    wiredAvailableAccounts;
    @wire(GetFinanceAccounts, { userId: '$userId' })
    async wiredAvailableAccountsHandler(result) {
        this.wiredAvailableAccounts = result;
        const { error, data } = result;
        this.hasError = false;
        if(data) {
            this.debugMessage('Getting Available Accounts Data: '+JSON.stringify(data));
            this.availableAccounts = data;
            await this.getCurrentAccount();
        } else if(error) {
            this.handleError('Getting Available Accounts Error: '+JSON.stringify(error))
            this.availableAccounts = [];
        }
    }

    async getCurrentAccount() {
        console.log(Object.keys(sessionStorage));
        const accountId = sessionStorage.getItem('FINANCE_ACCOUNT_ID');
        this.debugMessage('FINANCE_ACCOUNT_ID: ' + accountId);
        const account = this.availableAccounts.find(account => account.Id === accountId);
        if(account) {
            this._currentAccount = account;
            this.isLoading = false;
            return;
        }
        if(!this.isRequired) {
            this.isLoading = false;
            return;
        }
        await this.openModal();
    }

    _currentAccount;
    get SelectedAccount() {
        return this._currentAccount;
    }

    get buttonLabel() {
        if(this.isLoading) {
            return 'Loading...';
        } else {
            return this._currentAccount ? this._currentAccount.Name : 'Select Account';
        }
    }

    async handleSwitchAccount(event) {
        this.debugMessage('Handle Switch Account');
        await this.openModal();
    }

    async openModal() {
        this.debugMessage('Open Modal');
        this.isLoading = false;
        const account = await AccountSwitcherModal.open({
            size: 'medium',
            modalTitle: 'Finance Account Switcher',
            accounts: this.availableAccounts,
        });
        if(account) {
            this.debugMessage('Selected Account: '+JSON.stringify(account));
            sessionStorage.setItem('FINANCE_ACCOUNT_ID', account.Id); 
            this.debugMessage('FINANCE_ACCOUNT_ID: ' + sessionStorage.getItem('FINANCE_ACCOUNT_ID'));
            window.location.reload();
        }
    }

    hasError;
    errorMessage;
    handleError(message) {
        this.hasError = true;
        this.errorMessage = message;
        this.debugMessage(message); 
    }

    @api debug;
    debugMessage(message) {
        if(this.debug == false) return;
        console.log(JSON.stringify(message));
    }
}