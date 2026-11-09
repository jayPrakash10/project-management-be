import * as sectionRepository from '../repositories/section.repository';
import type { AuthUser, Section } from '../types/models';
import { NotFoundError } from '../utils/errors';
import type { CreateSectionInput, UpdateSectionInput } from '../validators/section.validator';
import { getProjectForManager, getProjectForMember } from './access.service';

async function getSectionForManager(actor: AuthUser, sectionId: string): Promise<Section> {
  const section = await sectionRepository.findById(sectionId);
  if (!section) {
    throw new NotFoundError('Section not found');
  }
  await getProjectForManager(section.projectId, actor);
  return section;
}

export async function listSections(actor: AuthUser, projectId: string): Promise<Section[]> {
  await getProjectForMember(projectId, actor);
  return sectionRepository.listByProject(projectId);
}

export async function createSection(actor: AuthUser, projectId: string, input: CreateSectionInput): Promise<Section> {
  await getProjectForManager(projectId, actor);
  const position = input.position ?? (await sectionRepository.getNextPosition(projectId));
  return sectionRepository.create({ projectId, name: input.name, position });
}

export async function updateSection(actor: AuthUser, sectionId: string, input: UpdateSectionInput): Promise<Section> {
  await getSectionForManager(actor, sectionId);
  return sectionRepository.update(sectionId, input);
}

// Tasks in a deleted section are kept; the foreign key sets their section to null.
export async function deleteSection(actor: AuthUser, sectionId: string): Promise<void> {
  await getSectionForManager(actor, sectionId);
  await sectionRepository.remove(sectionId);
}
