public with sharing class FinanceAccountSwitcher {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> GetFinanceAccounts(Id userId) {
        List<Account> accounts = new List<Account>();
        if(userId == null) return accounts;
        try {
            accounts = [SELECT Id, Name FROM Account WHERE OwnerId =: userId AND RecordType.DeveloperName = 'Finance' ORDER BY Name ASC];
        } catch (Exception e) {
            throw new AuraHandledException('Error Getting Finance Accounts: '+e.getMessage());
        }
        return accounts;
    }
}