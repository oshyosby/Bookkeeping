/*import { LightningElement, api } from 'lwc';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class BarcodeScanner extends LightningElement 
{
    @api guid;
    scanAgain = false;
    hasError = false;
    errorMessage = '';

    connectedCallback() {
        this.myScanner = getBarcodeScanner(); 
        this.openScanner();
    }

    openScanner(){   
        if(this.myScanner.isAvailable()) {

            const scanningOptions = {
                barcodeTypes: [this.myScanner.barcodeTypes.QR, 
                                this.myScanner.barcodeTypes.UPC_E,
                                this.myScanner.barcodeTypes.EAN_13,
                                this.myScanner.barcodeTypes.CODE_39 ],
                instructionText: 'Scan a QR',
                successText: 'Scanning complete.'
            }; 
            this.myScanner.beginCapture(scanningOptions)
            .then((result) => { 
                this.guid = result.value;
            })
            .catch((error) => { 
                this.scanAgain = true;
                this.hasError = true;
                this.errorMessage = 'No QR Code Scanned';
            })
            .finally(() => {
                this.myScanner.endCapture();
                if(this.guid)
                {
                    const navigateNextEvent = new FlowNavigationNextEvent();
                    this.dispatchEvent(navigateNextEvent);
                }
            }); 
        }
        else {
            this.hasError = true;
            this.errorMessage = 'Scanner not supported on this device'
        }
    }
}*/
import { LightningElement, api } from 'lwc';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';
 
export default class BarcodeScanner extends LightningElement {
        
    myScanner;
    @api guid = '';
    @api availableActions = [];
    @api openScanner;

    /**
     * When component is initialized, detect whether to enable Scan button
     */
    connectedCallback() {
        this.myScanner = getBarcodeScanner(); 
        if(this.openScanner === true) {
            this.beginScanning();
        }
    }
 
    /**
     * Method executed on click of Barcode scan button
     * @param event 
     */
    beginScanning(){ 
        //Clear scannedBarcode prior to scanning.
        this.guid = '';
 
        const scanningOptions = {
                barcodeTypes: [this.myScanner.barcodeTypes.QR],
                instructionText: 'Scan a QR Code',
                successText: 'Scanning complete.'
            };
 
        if(this.myScanner != null && this.myScanner.isAvailable()) {            
            this.myScanner.beginCapture(scanningOptions)
            .then((result) => { 
                this.guid = result.value;
                if(this.availableActions.find(action => action === 'NEXT')){this.dispatchEvent(new FlowNavigationNextEvent());}
            })
            .catch((error) => { 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Scanner Error',
                        message:
                            'There was a problem scanning the barcode: ' +
                            error.message,
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
            })
            .finally(() => {
                this.myScanner.endCapture();
            }); 
        }
        else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Scanner Is Not Available',
                    message: 'Try again from the Salesforce app on a mobile device.',
                    variant: 'error'
                })
            );
        }
    }   
 
    handleInputChange(event) {
        this.guid = event.target.value;
    }
 
    /**
     * Utility method to show error message
     * @param  title 
     * @param  msg 
     */
    showError(title,msg) {
        const event = new ShowToastEvent({
            title: title,
            message: msg,
            error : 'error'
        });
        this.dispatchEvent(event);
    }
}