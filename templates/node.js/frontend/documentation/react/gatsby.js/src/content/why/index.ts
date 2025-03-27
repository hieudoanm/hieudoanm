import { Reason } from '../../components/organisms/Why';

const reason: Reason = {
  id: 'reason-1',
  tab: 'Why you choose our service?',
  title: 'We will turn your idea in the successful business model framework',
  description:
    'Get your tests delivered at let home collect sample from the victory of the managements that supplies best design system guidelines ever.',
  items: [
    'Medical and vision',
    'Life insurance',
    'HSAs and FSAs',
    'Commuter benefits',
  ],
};

export const why: { reasons: Reason[] } = {
  reasons: [reason, reason, reason],
};
