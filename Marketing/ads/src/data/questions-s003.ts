/**
 * Story S003, "The Flood", from assets/data/{Family,School,SmallGroup}Questions.json
 * — question set 1, verbatim. Q1, Q3 and Q4 are shown because they are the three
 * that diverge most between audiences; Q2 is close to identical across all three
 * and would undercut the point of the ad.
 *
 * Set 1 covers all 365 stories. Set 2 has gaps (345/345/344), so never claim
 * "two sets for every story".
 */
export type Audience = {
  label: string;
  questions: string[];
};

export const FLOOD: Audience[] = [
  {
    label: 'Family',
    questions: [
      'What was different about Noah’s choices?',
      'How can our family choose what is right?',
      'What is one way we will trust God?',
    ],
  },
  {
    label: 'School',
    questions: [
      'What differences do you see between Noah and his world?',
      'When is it hardest for you to follow God at school?',
      'What small step of integrity will you practice this week?',
    ],
  },
  {
    label: 'Small Group',
    questions: [
      'What contrasts do you see between Noah and the surrounding culture?',
      'How does this challenge our comfort with cultural norms that conflict with God’s ways?',
      'What one integrity practice will you commit to in a setting where it costs you?',
    ],
  },
];
