import React from 'react';
import { Divider, List, Checkbox } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import styled from 'styled-components';
import { Entity } from '../../../../types.generated';
import { useEntityRegistry } from '../../../useEntityRegistry';
import DefaultPreviewCard from '../../../preview/DefaultPreviewCard';
import { IconStyleType } from '../../../entity/Entity';
import { capitalizeFirstLetter } from '../../../shared/textUtil';

const StyledList = styled(List)`
    margin-top: -1px;
    box-shadow: ${(props) => props.theme.styles['box-shadow']};
    flex: 1;
    .ant-list-items > .ant-list-item {
        padding-right: 0px;
        padding-left: 0px;
    }
    > .ant-list-header {
        padding-right: 0px;
        padding-left: 0px;
        font-size: 14px;
        font-weight: 600;
        margin-left: -20px;
        border-bottom: none;
        padding-bottom: 0px;
        padding-top: 15px;
    }
    &::-webkit-scrollbar {
        height: 12px;
        width: 5px;
        background: #f2f2f2;
    }
    &::-webkit-scrollbar-thumb {
        background: #cccccc;
        -webkit-border-radius: 1ex;
        -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
    }
` as typeof List;

const ListItem = styled.div`
    padding-right: 40px;
    padding-left: 40px;
    padding-top: 16px;
    padding-bottom: 8px;
`;

const ThinDivider = styled(Divider)`
    padding: 0px;
    margin: 0px;
`;

type AdditionalProperties = {
    degree?: number;
};

const CheckBoxGroup = styled(Checkbox.Group)`
    flex: 1;
    width: 100%;
    background-color: rgb(255, 255, 255);
    padding-right: 32px;
    padding-left: 32px;
    padding-top: 8px;
    padding-bottom: 8px;
    > .ant-checkbox-group-item {
        display: block;
        margin-right: 0;
    }
    &&& .ant-checkbox {
        display: inline-block;
        position: relative;
        top: 48px;
    }
`;

const LabelContainer = styled.span`
    position: relative;
    left: 24px;
    bottom: 6px;
    * {
        pointer-events: none;
    }
`;

type Props = {
    // additional data about the search result that is not part of the entity used to enrich the
    // presentation of the entity. For example, metadata about how the entity is related for the case
    // of impact analysis
    additionalPropertiesList?: Array<AdditionalProperties>;
    entities: Array<Entity>;
    onClick?: (index: number) => void;
    showSelectMode?: boolean;
    setCheckedSearchResults?: (checkedSearchResults: Array<CheckboxValueType>) => any;
    checkedSearchResults?: CheckboxValueType[];
};

export const EntityNameList = ({
    additionalPropertiesList,
    entities,
    onClick,
    showSelectMode,
    setCheckedSearchResults,
    checkedSearchResults,
}: Props) => {
    const entityRegistry = useEntityRegistry();
    if (
        additionalPropertiesList?.length !== undefined &&
        additionalPropertiesList.length > 0 &&
        additionalPropertiesList?.length !== entities.length
    ) {
        console.warn(
            'Warning: additionalPropertiesList length provided to EntityNameList does not match entity array length',
            { additionalPropertiesList, entities },
        );
    }

    const onChange = (checkedValues: CheckboxValueType[]) => {
        setCheckedSearchResults?.(checkedValues);
    };

    const options = entities.map((entity, index) => {
        const additionalProperties = additionalPropertiesList?.[index];
        const genericProps = entityRegistry.getGenericEntityProperties(entity.type, entity);
        const platformLogoUrl = genericProps?.platform?.properties?.logoUrl;
        const platformName =
            genericProps?.platform?.properties?.displayName || capitalizeFirstLetter(genericProps?.platform?.name);
        const entityTypeName = entityRegistry.getEntityName(entity.type);
        const displayName = entityRegistry.getDisplayName(entity.type, entity);
        const url = entityRegistry.getEntityUrl(entity.type, entity.urn);
        const fallbackIcon = entityRegistry.getIcon(entity.type, 18, IconStyleType.ACCENT);
        const subType = genericProps?.subTypes?.typeNames?.length && genericProps?.subTypes?.typeNames[0];
        const entityCount = genericProps?.entityCount;
        return {
            label: (
                <LabelContainer>
                    <DefaultPreviewCard
                        name={displayName}
                        logoUrl={platformLogoUrl || undefined}
                        logoComponent={fallbackIcon}
                        url={url}
                        platform={platformName || undefined}
                        type={subType || entityTypeName}
                        titleSizePx={14}
                        tags={genericProps?.globalTags || undefined}
                        glossaryTerms={genericProps?.glossaryTerms || undefined}
                        domain={genericProps?.domain?.domain}
                        onClick={() => onClick?.(index)}
                        entityCount={entityCount}
                        degree={additionalProperties?.degree}
                    />
                    <ThinDivider />
                </LabelContainer>
            ),
            value: entity.urn,
        };
    });

    return (
        <>
            {showSelectMode ? (
                <CheckBoxGroup options={options} onChange={onChange} value={checkedSearchResults} />
            ) : (
                <StyledList
                    bordered
                    dataSource={entities}
                    renderItem={(entity, index) => {
                        const additionalProperties = additionalPropertiesList?.[index];
                        const genericProps = entityRegistry.getGenericEntityProperties(entity.type, entity);
                        const platformLogoUrl = genericProps?.platform?.properties?.logoUrl;
                        const platformName =
                            genericProps?.platform?.properties?.displayName ||
                            capitalizeFirstLetter(genericProps?.platform?.name);
                        const entityTypeName = entityRegistry.getEntityName(entity.type);
                        const displayName = entityRegistry.getDisplayName(entity.type, entity);
                        const url = entityRegistry.getEntityUrl(entity.type, entity.urn);
                        const fallbackIcon = entityRegistry.getIcon(entity.type, 18, IconStyleType.ACCENT);
                        const subType =
                            genericProps?.subTypes?.typeNames?.length && genericProps?.subTypes?.typeNames[0];
                        const entityCount = genericProps?.entityCount;
                        return (
                            <>
                                <ListItem>
                                    <DefaultPreviewCard
                                        name={displayName}
                                        logoUrl={platformLogoUrl || undefined}
                                        logoComponent={fallbackIcon}
                                        url={url}
                                        platform={platformName || undefined}
                                        type={subType || entityTypeName}
                                        titleSizePx={14}
                                        tags={genericProps?.globalTags || undefined}
                                        glossaryTerms={genericProps?.glossaryTerms || undefined}
                                        domain={genericProps?.domain?.domain}
                                        onClick={() => onClick?.(index)}
                                        entityCount={entityCount}
                                        degree={additionalProperties?.degree}
                                    />
                                </ListItem>
                                <ThinDivider />
                            </>
                        );
                    }}
                />
            )}
        </>
    );
};
