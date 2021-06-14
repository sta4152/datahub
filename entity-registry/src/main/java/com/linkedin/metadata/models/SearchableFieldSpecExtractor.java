package com.linkedin.metadata.models;

import com.linkedin.data.schema.ComplexDataSchema;
import com.linkedin.data.schema.DataSchema;
import com.linkedin.data.schema.DataSchemaTraverse;
import com.linkedin.data.schema.PathSpec;
import com.linkedin.data.schema.PrimitiveDataSchema;
import com.linkedin.data.schema.annotation.SchemaVisitor;
import com.linkedin.data.schema.annotation.SchemaVisitorTraversalResult;
import com.linkedin.data.schema.annotation.TraverserContext;
import com.linkedin.metadata.models.annotation.SearchableAnnotation;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Implementation of {@link SchemaVisitor} responsible for extracting {@link SearchableFieldSpec}s
 * from an aspect schema.
 */
public class SearchableFieldSpecExtractor implements SchemaVisitor {

  private final List<SearchableFieldSpec> _specs = new ArrayList<>();
  private final Map<String, String> _searchFieldNamesToPatch = new HashMap<>();

  public List<SearchableFieldSpec> getSpecs() {
    return _specs;
  }

  @Override
  public void callbackOnContext(TraverserContext context, DataSchemaTraverse.Order order) {
    if (context.getEnclosingField() == null) {
      return;
    }

    if (DataSchemaTraverse.Order.PRE_ORDER.equals(order)) {

      final DataSchema currentSchema = context.getCurrentSchema().getDereferencedDataSchema();

      // First, check properties for primary annotation definition.
      final Map<String, Object> properties = context.getEnclosingField().getProperties();
      final Object primaryAnnotationObj = properties.get(SearchableAnnotation.ANNOTATION_NAME);

      if (primaryAnnotationObj != null) {
        validatePropertiesAnnotation(currentSchema, primaryAnnotationObj, context.getTraversePath().toString());
      }

      // Next, check resolved properties for annotations on primitives.
      final Map<String, Object> resolvedProperties = getResolvedProperties(currentSchema);
      final Object resolvedAnnotationObj = resolvedProperties.get(SearchableAnnotation.ANNOTATION_NAME);

      if (resolvedAnnotationObj != null) {
        if (currentSchema.getDereferencedDataSchema().isComplex()) {
          final ComplexDataSchema complexSchema = (ComplexDataSchema) currentSchema;
          if (isValidComplexType(complexSchema)) {
            extractSearchableAnnotation(resolvedAnnotationObj, currentSchema, context);
          }
        } else if (isValidPrimitiveType((PrimitiveDataSchema) currentSchema)) {
          extractSearchableAnnotation(resolvedAnnotationObj, currentSchema, context);
        } else {
          throw new ModelValidationException(String.format("Invalid @Searchable Annotation at %s", context.getSchemaPathSpec().toString()));
        }
      }
    }
  }

  private void extractSearchableAnnotation(
      final Object annotationObj,
      final DataSchema currentSchema,
      final TraverserContext context) {
    final PathSpec path = new PathSpec(context.getSchemaPathSpec());
    final SearchableAnnotation annotation =
        SearchableAnnotation.fromPegasusAnnotationObject(
            annotationObj,
            getSchemaFieldName(path),
            currentSchema.getDereferencedType(), path.toString());
    if (_searchFieldNamesToPatch.containsKey(annotation.getFieldName())
        && !_searchFieldNamesToPatch.get(annotation.getFieldName()).equals(context.getSchemaPathSpec().toString())) {
      throw new ModelValidationException(
          String.format("Entity has multiple searchable fields with the same field name %s",
              annotation.getFieldName()));
    }
    final SearchableFieldSpec fieldSpec = new SearchableFieldSpec(path, annotation, currentSchema);
    _specs.add(fieldSpec);
    _searchFieldNamesToPatch.put(annotation.getFieldName(), context.getSchemaPathSpec().toString());
  }

  @Override
  public VisitorContext getInitialVisitorContext() {
    return null;
  }

  @Override
  public SchemaVisitorTraversalResult getSchemaVisitorTraversalResult() {
    return new SchemaVisitorTraversalResult();
  }

  private String getSchemaFieldName(PathSpec pathSpec) {
    List<String> components = pathSpec.getPathComponents();
    String lastComponent = components.get(components.size() - 1);
    if (lastComponent.equals("*")) {
      return components.get(components.size() - 2);
    }
    return lastComponent;
  }

  private Map<String, Object> getResolvedProperties(final DataSchema schema) {
    return !schema.getResolvedProperties().isEmpty() ? schema.getResolvedProperties() : schema.getProperties();
  }

  private Boolean isValidComplexType(final ComplexDataSchema schema) {
    return DataSchema.Type.ENUM.equals(schema.getDereferencedDataSchema().getDereferencedType());
  }

  private Boolean isValidPrimitiveType(final PrimitiveDataSchema schema) {
    return true;
  }

  private void validatePropertiesAnnotation(DataSchema currentSchema, Object annotationObj, String pathStr) {

    // If primitive, assume the annotation is well formed until resolvedProperties reflects it.
    if (currentSchema.isPrimitive() || currentSchema.getDereferencedType().equals(DataSchema.Type.ENUM)) {
      return;
    }

    // Required override case. If the annotation keys are not overrides, they are incorrect.
    if (!Map.class.isAssignableFrom(annotationObj.getClass())) {
      throw new ModelValidationException(String.format(
          "Failed to validate @%s annotation declared inside %s: Invalid value type provided (Expected Map)",
          SearchableAnnotation.ANNOTATION_NAME,
          pathStr
      ));
    }

    Map<String, Object> annotationMap = (Map<String, Object>) annotationObj;

    if (annotationMap.size() == 0) {
      throw new ModelValidationException(
          String.format("Invalid @Searchable Annotation at %s. Annotation placed on invalid field of type %s. Must be placed on primitive field.",
              pathStr,
              currentSchema.getType()));
    }

    for (String key : annotationMap.keySet()) {
      if (!key.startsWith(Character.toString(PathSpec.SEPARATOR))) {
        throw new ModelValidationException(
            String.format("Invalid @Searchable Annotation at %s. Annotation placed on invalid field of type %s. Must be placed on primitive field.",
                pathStr,
                currentSchema.getType()));
      }
    }
  }
}