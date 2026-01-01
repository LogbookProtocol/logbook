import { SuiClient } from '@mysten/sui/client';
import { PACKAGE_ID } from './config';
import { Form } from './types';

export type { Form };

export async function getAllForms(suiClient: SuiClient): Promise<Form[]> {
  try {
    const { data } = await suiClient.queryTransactionBlocks({
      filter: {
        MoveFunction: {
          package: PACKAGE_ID,
          module: 'logbook',
          function: 'create_form',
        },
      },
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
      limit: 50,
    });

    console.log('Transaction data:', data);

    const formIds: string[] = [];

    for (const tx of data) {
      if (tx.effects?.created) {
        for (const obj of tx.effects.created) {
          formIds.push(obj.reference.objectId);
        }
      }
    }

    console.log('Found form IDs:', formIds);

    const forms: Form[] = [];
    for (const id of formIds) {
      const form = await getFormById(suiClient, id);
      if (form) {
        forms.push(form);
      }
    }

    return forms;
  } catch (error) {
    console.error('Error fetching forms:', error);
    return [];
  }
}

export async function getFormById(suiClient: SuiClient, formId: string): Promise<Form | null> {
  try {
    const object = await suiClient.getObject({
      id: formId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log('Form object:', object);

    if (object.data?.content?.dataType === 'moveObject') {
      const fields = object.data.content.fields as any;
      
      return {
        id: object.data.objectId,
        formType: fields.form_type,
        creator: fields.creator,
        title: fields.title,
        description: fields.description,
        options: fields.options,
        votes: fields.option_votes,
        totalParticipants: fields.total_participants,
        accessType: fields.access_type,
        authMethod: fields.auth_method,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching form:', error);
    return null;
  }
}
