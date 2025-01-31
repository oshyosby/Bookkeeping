import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class FlowContainer extends LightningModal 
{
    @api flow = {
        label: 'UI Name',
        name: 'Flow_API_Name',
        inputs: [{name: 'recordId', type: 'String', value: this.recordId}]
    }

    connectedCallback()
    {
        console.log('Flow Details '+JSON.stringify(this.flow))
    }

    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            console.log('Creating Flow Output Event');
            const flowOutputEvent = new CustomEvent('flowoutput', {
                detail: { 
                    outputs: event.detail.outputVariables
                }
            });
            this.dispatchEvent(flowOutputEvent);
            this.close();
        }
    }

    
}