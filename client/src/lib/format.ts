import _ from 'lodash'

/** 'medel' → 'Medel' – svårighetsgraden som den visas i listor, på kort och på guidesidan */
export const formatDifficulty = (difficulty: string): string => _.capitalize(difficulty)
